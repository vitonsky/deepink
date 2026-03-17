/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable @cspell/spellchecker */
/* eslint-disable no-bitwise */
/**
 * FlexSearch persistence adapter backed by IFilesStorage.
 *
 * Architecture
 * ────────────
 *  ① All index data lives in memory (Maps / Sets).  Every search query is
 *    answered without I/O; reads are O(1) hashtable lookups.
 *
 *  ② Each data category is split into CHUNK_COUNT shards chosen by hashing
 *    the primary key.  A dirty-set tracks which shards were mutated since
 *    the last flush; only dirty shards are re-serialised and written.
 *
 *  ③ All shard writes within a flush are issued in parallel (Promise.all),
 *    so wall-clock cost ≈ max(slowest shard write), not Σ(all shard writes).
 *
 *  ④ A reverse-reference index (_ref) maps every doc-id to the set of
 *    forward-index keys that contain it, enabling O(refs-per-doc) removals
 *    without scanning the full index.
 *
 *  ⑤ Multi-term intersection and suggest-mode merge are implemented in memory
 *    using the same scoring convention as the reference Redis adapter.
 *
 * File layout (all paths are relative to the IFilesStorage root)
 * ──────────────────────────────────────────────────────────────
 *  /{name}/map{field}/{0‥CHUNK_COUNT-1}   forward index shards
 *  /{name}/ctx{field}/{0‥CHUNK_COUNT-1}   context index shards
 *  /{name}/store/{0‥CHUNK_COUNT-1}        document-store shards (no field suffix – shared)
 *  /{name}/ref{field}/{0‥CHUNK_COUNT-1}   reverse-ref index shards
 *  /{name}/reg                            document registry (single file)
 *  /{name}/tag{field}                     tag store (single file)
 */

export type IFilesStorage = {
	write: (uuid: string, buffer: ArrayBuffer) => Promise<void>;
	get: (uuid: string) => Promise<ArrayBuffer | null>;
	delete: (uuid: string[]) => Promise<void>;
	list: () => Promise<string[]>;
};

// ─── tuning ───────────────────────────────────────────────────────────────────

/**
 * Number of shards per data category.
 *
 * More shards → smaller per-shard payloads, finer-grained dirty writes,
 *               but more file handles on open().
 *
 * Guideline:
 *   ≤ 100 k docs  → 64   (default)
 *   ≤ 1 M  docs  → 256
 *   > 1 M  docs  → 512
 */
const CHUNK_COUNT = 64;

// ─── codec ───────────────────────────────────────────────────────────────────

const _ENC = new TextEncoder();
const _DEC = new TextDecoder();

function encode(value: unknown): ArrayBuffer {
	return _ENC.encode(JSON.stringify(value)).buffer;
}

function decode<T>(buf: ArrayBuffer): T {
	return JSON.parse(_DEC.decode(buf)) as T;
}

// ─── shard hash ───────────────────────────────────────────────────────────────

/**
 * djb2-xor variant; result is always in [0, count).
 * FlexSearch tokens are short ASCII strings, so this runs in well under 1 µs.
 */
function shard(key: string, count: number = CHUNK_COUNT): number {
	let h = 5381;
	for (let i = 0; i < key.length; i++) {
		h = (Math.imul(h, 33) ^ key.charCodeAt(i)) | 0;
	}
	return (h >>> 0) % count;
}

// ─── misc utils ───────────────────────────────────────────────────────────────

function sanitize(s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

/**
 * Remove trailing empty / null score-bucket slots before serialisation.
 * Avoids storing a tail of `null` entries produced by sparse bucket arrays.
 */
function trimBuckets(bkts: string[][]): string[][] {
	let end = bkts.length;
	while (end > 0 && !bkts[end - 1]?.length) end--;
	return end < bkts.length ? bkts.slice(0, end) : bkts;
}

// ─── internal types ───────────────────────────────────────────────────────────

/**
 * Score-bucket array.
 * bkts[0] = doc-ids at highest relevance score.
 * bkts[N] = doc-ids at lowest relevance score.
 * Mirrors FlexSearch's own internal `map` structure.
 */
type Bkts = string[][];

// ─── storage class ────────────────────────────────────────────────────────────

export class FlexSearchStorage {
	// satisfies StorageInterface contract;
	// we expose _fs here since it is our "connection" object
	public db: any;

	// ── Properties read/written by FlexSearch ────────────────────────────────

	/** Tell FlexSearch this adapter handles tag-based filtering. */
	public support_tag_search = true;

	/**
	 * We always maintain the reverse-ref index so that doc removals cost
	 * O(refs-per-doc) regardless of index size.  FlexSearch uses this flag
	 * to decide whether it can skip building its own ref tracking.
	 */
	public fastupdate = true;

	public resolution = 9;
	public resolution_ctx = 9;

	/**
	 * '' | 'number'
	 * Detected automatically from the first doc-id seen; do not set manually.
	 */
	public type = '';

	// ── I/O backend ──────────────────────────────────────────────────────────

	private readonly _fs: IFilesStorage;

	// ── Namespace ────────────────────────────────────────────────────────────

	private readonly _name: string; // sanitised index name, e.g. "products"
	private readonly _field: string; // field suffix,          e.g. "-title" or ""

	// ── Sharded in-memory stores ──────────────────────────────────────────────
	// Element [i] is the shard for keys where shard(key) === i.

	/** Forward index — term → score-buckets */
	private readonly _map: Map<string, Bkts>[];

	/** Context index — ctxTerm → ( innerTerm → score-buckets ) */
	private readonly _ctx: Map<string, Map<string, Bkts>>[];

	/** Document store — id → raw document object */
	private readonly _store: Map<string, unknown>[];

	/**
	 * Reverse-reference index — id → Set<refKey>
	 *
	 * refKey formats (pipe `|` is used as separator; safe because FlexSearch
	 * normalises all tokens to [a-z0-9], so `|` never appears in a token):
	 *
	 *   "map|{term}"                  → entry in forward index
	 *   "ctx|{ctxTerm}|{innerTerm}"   → entry in context index
	 */
	private readonly _ref: Map<string, Set<string>>[];

	/** Registry — all known doc-ids */
	private readonly _reg = new Set<string>();

	/** Tag store — tag-key → [doc-ids] */
	private readonly _tag = new Map<string, string[]>();

	// ── Dirty tracking ────────────────────────────────────────────────────────
	// Only shards whose Set contains the shard-index are re-written on flush.

	private readonly _dm = new Set<number>(); // dirty map   shards
	private readonly _dc = new Set<number>(); // dirty ctx   shards
	private readonly _ds = new Set<number>(); // dirty store shards
	private readonly _dr = new Set<number>(); // dirty ref   shards
	private _dirtyReg = false;
	private _dirtyTag = false;

	// ── Misc ─────────────────────────────────────────────────────────────────

	private _isOpen = false;

	/** Cached from the mounted FlexSearch instance; used in get() tag-path. */
	private _bidir = false;

	// ─────────────────────────────────────────────────────────────────────────
	// Constructor
	// ─────────────────────────────────────────────────────────────────────────

	constructor(
		fs: IFilesStorage,
		name: string | { name?: string; field?: string } = 'flexsearch',
		config: { field?: string } = {},
	) {
		this._fs = fs;

		if (typeof name === 'string') {
			this._name = sanitize(name) || 'flexsearch';
			this._field = config.field ? `-${sanitize(config.field)}` : '';
		} else {
			this._name = sanitize(name.name ?? 'flexsearch') || 'flexsearch';
			this._field = name.field ? `-${sanitize(name.field)}` : '';
		}

		const mkChunks = <T>(factory: () => T): T[] =>
			Array.from({ length: CHUNK_COUNT }, factory);

		this._map = mkChunks(() => new Map<string, Bkts>());
		this._ctx = mkChunks(() => new Map<string, Map<string, Bkts>>());
		this._store = mkChunks(() => new Map<string, unknown>());
		this._ref = mkChunks(() => new Map<string, Set<string>>());
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Path helpers
	// ─────────────────────────────────────────────────────────────────────────

	private _base(seg: string): string {
		return `/${this._name}/${seg}`;
	}

	// Field-scoped paths (separate per Document field index)
	private _pMap(i: number): string {
		return this._base(`map${this._field}/${i}`);
	}
	private _pCtx(i: number): string {
		return this._base(`ctx${this._field}/${i}`);
	}
	private _pRef(i: number): string {
		return this._base(`ref${this._field}/${i}`);
	}
	private _pTag(): string {
		return this._base(`tag${this._field}`);
	}

	// Unscoped paths (shared across all fields of the same index)
	private _pStore(i: number): string {
		return this._base(`store/${i}`);
	}
	private _pReg(): string {
		return this._base('reg');
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Lifecycle
	// ─────────────────────────────────────────────────────────────────────────

	async mount(index: any): Promise<void> {
		// Document index: it iterates its field sub-indices and mounts each one
		if (index.index) return index.mount(this);

		index.db = this;
		this.resolution = index.resolution ?? this.resolution;
		this.resolution_ctx = index.resolution_ctx ?? this.resolution_ctx;
		this._bidir = index.bidirectional ?? false;
		return this.open();
	}

	async open(): Promise<void> {
		if (this._isOpen) return;
		this._isOpen = true;

		// All shard reads are fired in parallel.
		// Missing files are silently ignored (first run / partial index).
		const tasks: Promise<void>[] = [];

		for (let i = 0; i < CHUNK_COUNT; i++) {
			const idx = i; // capture for async closure

			tasks.push(
				this._loadShard(this._pMap(idx), (raw) => {
					const data = raw as Record<string, Bkts>;
					for (const [k, v] of Object.entries(data)) this._map[idx].set(k, v);
				}),

				this._loadShard(this._pCtx(idx), (raw) => {
					const data = raw as Record<string, Record<string, Bkts>>;
					for (const [ct, inner] of Object.entries(data)) {
						const m = new Map<string, Bkts>();
						for (const [t, b] of Object.entries(inner)) m.set(t, b);
						this._ctx[idx].set(ct, m);
					}
				}),

				this._loadShard(this._pStore(idx), (raw) => {
					const data = raw as Record<string, unknown>;
					for (const [k, v] of Object.entries(data)) this._store[idx].set(k, v);
				}),

				this._loadShard(this._pRef(idx), (raw) => {
					const data = raw as Record<string, string[]>;
					for (const [k, v] of Object.entries(data))
						this._ref[idx].set(k, new Set(v));
				}),
			);
		}

		tasks.push(
			this._loadShard(this._pReg(), (raw) => {
				for (const id of raw as string[]) this._reg.add(id);
			}),
			this._loadShard(this._pTag(), (raw) => {
				const data = raw as Record<string, string[]>;
				for (const [k, v] of Object.entries(data)) this._tag.set(k, v);
			}),
		);

		await Promise.all(tasks);
	}

	async close(): Promise<void> {
		await this._flush();
		this._isOpen = false;
	}

	async destroy(): Promise<void> {
		return this.clear();
	}

	async clear(): Promise<void> {
		for (let i = 0; i < CHUNK_COUNT; i++) {
			this._map[i].clear();
			this._ctx[i].clear();
			this._store[i].clear();
			this._ref[i].clear();
		}
		this._reg.clear();
		this._tag.clear();
		this._dm.clear();
		this._dc.clear();
		this._ds.clear();
		this._dr.clear();
		this._dirtyReg = this._dirtyTag = false;

		const prefix = `/${this._name}/`;
		const all = await this._fs.list();
		const ours = all.filter((p) => p.startsWith(prefix));
		if (ours.length) await this._fs.delete(ours);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// commit()
	// ─────────────────────────────────────────────────────────────────────────

	async commit(fs: any): Promise<void> {
		// ① Drain the pending-task queue (deletions queued between commits)
		const tasks: any[] = fs.commit_task ?? [];
		fs.commit_task = [];

		const removals: string[] = [];
		for (const task of tasks) {
			if (task.del != null) removals.push(String(task.del));
		}
		if (removals.length) this._removeInMemory(removals);

		if (!fs.reg?.size && !removals.length) return;

		// ② Merge forward map
		if (fs.map?.size) {
			for (const [term, bkts] of fs.map as Map<string, Bkts>) {
				const si = shard(term);
				let ex = this._map[si].get(term);
				if (!ex) {
					ex = [];
					this._map[si].set(term, ex);
				}
				this._mergeInto(ex, bkts, `map|${term}`);
				this._dm.add(si);
			}
		}

		// ③ Merge context map
		if (fs.ctx?.size) {
			for (const [ct, ctxMap] of fs.ctx as Map<string, Map<string, Bkts>>) {
				const si = shard(ct);
				let ctxEntry = this._ctx[si].get(ct);
				if (!ctxEntry) {
					ctxEntry = new Map();
					this._ctx[si].set(ct, ctxEntry);
				}

				for (const [term, bkts] of ctxMap) {
					let ex = ctxEntry.get(term);
					if (!ex) {
						ex = [];
						ctxEntry.set(term, ex);
					}
					this._mergeInto(ex, bkts, `ctx|${ct}|${term}`);
					this._dc.add(si);
				}
			}
		}

		// ④ Merge document store
		if (fs.store?.size) {
			for (const [id, doc] of fs.store as Map<string | number, unknown>) {
				if (!doc) continue;
				const sid = String(id);
				const si = shard(sid);
				if (this.type === '' && typeof id === 'number') this.type = 'number';
				this._store[si].set(sid, doc);
				this._ds.add(si);
			}
		}

		// ⑤ Update registry
		if (!fs.bypass && fs.reg?.size) {
			for (const id of this._iterReg(fs.reg)) this._reg.add(id);
			this._dirtyReg = true;
		}

		// ⑥ Merge tags
		if (fs.tag?.size) {
			for (const [tag, ids] of fs.tag as Map<string, (string | number)[]>) {
				const cur = this._tag.get(tag) ?? [];
				const set = new Set(cur);
				for (const id of ids) set.add(String(id));
				this._tag.set(tag, [...set]);
			}
			this._dirtyTag = true;
		}

		// ⑦ Clear FlexSearch's in-memory accumulators
		//    This is the actual "offload from RAM" step.
		fs.map?.clear();
		fs.ctx?.clear();
		fs.tag?.clear();
		fs.store?.clear();
		if (!fs.document) fs.reg?.clear();

		// ⑧ Write only the dirty shards to the file store
		await this._flush();
	}

	// ─────────────────────────────────────────────────────────────────────────
	// get() — single-term lookup
	// ─────────────────────────────────────────────────────────────────────────

	get(
		key: string,
		ctx?: string | null,
		limit = 0,
		offset = 0,
		resolve = true,
		enrich = false,
		tags?: any[],
	): Promise<any[]> {
		// Tag-qualified single-term search: delegate to search() for filtering
		if (tags) {
			return this.search(
				{ depth: !!ctx, bidirectional: this._bidir },
				ctx ? [ctx, key] : [key],
				limit,
				offset,
				false,
				resolve,
				enrich,
				tags,
			);
		}

		const bkts = ctx
			? this._ctx[shard(ctx)].get(ctx)?.get(key)
			: this._map[shard(key)].get(key);

		if (!bkts?.length) return Promise.resolve([]);

		const res = ctx ? this.resolution_ctx : this.resolution;
		const result = this._materialise(bkts, limit, offset, resolve, res);
		return Promise.resolve(enrich ? this._enrichItems(result, resolve) : result);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// search() — multi-term lookup with intersection / suggest
	// ─────────────────────────────────────────────────────────────────────────

	search(
		idx: any,
		query: string[],
		limit = 100,
		offset = 0,
		suggest = false,
		resolve = true,
		enrich = false,
		tags?: any[],
	): Promise<any[]> {
		const useCtx = query.length > 1 && idx.depth;
		const bidir = idx.bidirectional ?? this._bidir;
		const res = useCtx ? this.resolution_ctx : this.resolution;

		// ── Build a per-term { id → maxScore } map ───────────────────────────

		const scoreMaps: Map<string, number>[] = [];

		if (useCtx) {
			// Context search: score consecutive keyword pairs
			let kw = query[0];
			for (let i = 1; i < query.length; i++) {
				const term = query[i];
				const swap = bidir && term > kw;
				const ct = swap ? term : kw;
				const it = swap ? kw : term;
				const bkts = this._ctx[shard(ct)].get(ct)?.get(it);
				if (bkts?.length) scoreMaps.push(this._toScoreMap(bkts, res));
				kw = term;
			}
		} else {
			for (const term of query) {
				const bkts = this._map[shard(term)].get(term);
				if (bkts?.length) scoreMaps.push(this._toScoreMap(bkts, res));
			}
		}

		if (!scoreMaps.length) return Promise.resolve([]);

		// ── Merge score maps ─────────────────────────────────────────────────

		const merged = suggest ? this._suggest(scoreMaps) : this._intersect(scoreMaps);

		// ── Apply tag filters ────────────────────────────────────────────────

		if (tags?.length) {
			for (const tagSet of this._resolveTagSets(tags)) {
				for (const id of merged.keys()) {
					if (!tagSet.has(id)) merged.delete(id);
				}
			}
		}

		if (!merged.size) return Promise.resolve([]);

		// ── Sort by score desc, paginate ─────────────────────────────────────
		//
		// For result sets larger than ~10 k entries a partial-sort (heap /
		// quickselect) would reduce O(N log N) → O(N log limit).
		// Full sort is fine for the typical limit ≤ 1000 case.

		let entries = [...merged.entries()].sort((a, b) => b[1] - a[1]);
		if (offset) entries = entries.slice(offset);
		if (limit) entries = entries.slice(0, limit);

		let result: any[];

		if (resolve) {
			result = entries.map(([id]) => this._typed(id));
		} else {
			result = [];
			for (const [id, score] of entries) {
				const bi = Math.max(res - score, 0);
				(result[bi] ??= []).push(this._typed(id));
			}
		}

		return Promise.resolve(enrich ? this._enrichItems(result, resolve) : result);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// tag() / enrich() / has() / remove()
	// ─────────────────────────────────────────────────────────────────────────

	tag(tag: string, limit = 0, offset = 0, enrich = false): Promise<any[]> {
		const ids = this._tag.get(tag) ?? [];
		const page = ids.slice(offset, limit ? offset + limit : undefined);
		const out = enrich
			? this._enrichItems(page, true)
			: page.map((id) => this._typed(id));
		return Promise.resolve(out);
	}

	enrich(ids: string | string[]): { id: any; doc: unknown }[] {
		const arr = Array.isArray(ids) ? ids : [ids];
		return arr.map((rawId) => {
			const id = String(rawId);
			const doc = this._store[shard(id)].get(id) ?? null;
			return { id: this._typed(id), doc };
		});
	}

	has(id: string | number): Promise<boolean> {
		return Promise.resolve(this._reg.has(String(id)));
	}

	async remove(ids: string | number | (string | number)[]): Promise<void> {
		if (ids == null) return;
		const arr = (Array.isArray(ids) ? ids : [ids]).map(String);
		if (!arr.length) return;
		this._removeInMemory(arr);
		await this._flush();
	}

	/**
	 * Stub for API compatibility.
	 * Our commit() batches all writes internally via dirty-shard tracking,
	 * so explicit transaction scoping is not needed.
	 */
	async transaction(
		task: (ctx: this) => Promise<void>,
		cb?: () => void,
	): Promise<void> {
		await task.call(this, this);
		cb?.();
	}

	info(): Record<string, number> {
		let terms = 0,
			ctxPairs = 0,
			storedDocs = 0;
		for (let i = 0; i < CHUNK_COUNT; i++) {
			terms += this._map[i].size;
			storedDocs += this._store[i].size;
			for (const m of this._ctx[i].values()) ctxPairs += m.size;
		}
		return {
			registered: this._reg.size,
			terms,
			contextPairs: ctxPairs,
			storedDocs,
			tags: this._tag.size,
		};
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Private — data manipulation
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Merge `incoming` score-buckets into `existing` and register each new
	 * doc-id under `refKey` in the reverse-ref index.
	 *
	 * Using a per-bucket Set<string> for deduplication keeps the merge at
	 * O(1) per id rather than the O(n) cost of Array.includes().
	 */
	private _mergeInto(existing: Bkts, incoming: Bkts, refKey: string): void {
		for (let i = 0; i < incoming.length; i++) {
			const src = incoming[i];
			if (!src?.length) continue;

			// Detect id type once from the first value seen
			if (this.type === '' && typeof src[0] === 'number') this.type = 'number';

			const dst = (existing[i] ??= []);
			const seen = new Set(dst); // O(1) membership test

			for (const rawId of src) {
				const id = String(rawId);

				if (!seen.has(id)) {
					seen.add(id);
					dst.push(id);
				}

				// Update reverse-ref index so removals can find this entry
				const rsi = shard(id);
				let refs = this._ref[rsi].get(id);
				if (!refs) {
					refs = new Set();
					this._ref[rsi].set(id, refs);
				}
				refs.add(refKey); // Set is idempotent — no duplicate check needed
				this._dr.add(rsi);
			}
		}
	}

	/**
	 * Remove doc-ids from all in-memory structures.
	 * Does NOT flush to disk — callers are responsible for calling _flush().
	 */
	private _removeInMemory(ids: string[]): void {
		for (const id of ids) {
			if (!this._reg.has(id)) continue;

			// ── Remove from forward / context indices via reverse refs ────────
			const rsi = shard(id);
			const refs = this._ref[rsi].get(id);

			if (refs) {
				for (const ref of refs) {
					const p0 = ref.indexOf('|');
					const kind = ref.slice(0, p0);
					const rest = ref.slice(p0 + 1);

					if (kind === 'map') {
						const si = shard(rest);
						this._stripId(this._map[si].get(rest), id);
						this._dm.add(si);
					} else {
						// ref = "ctx|{ctxTerm}|{innerTerm}"
						const p1 = rest.indexOf('|');
						const ct = rest.slice(0, p1);
						const inner = rest.slice(p1 + 1);
						const si = shard(ct);
						this._stripId(this._ctx[si].get(ct)?.get(inner), id);
						this._dc.add(si);
					}
				}

				this._ref[rsi].delete(id);
				this._dr.add(rsi);
			}

			// ── Remove from document store ────────────────────────────────────
			const ssi = shard(id);
			if (this._store[ssi].delete(id)) this._ds.add(ssi);

			// ── Remove from tag lists ─────────────────────────────────────────
			// No reverse-tag index; tags are few in practice so O(tags) is fine.
			for (const tagIds of this._tag.values()) {
				const pos = tagIds.indexOf(id);
				if (pos !== -1) {
					tagIds.splice(pos, 1);
					this._dirtyTag = true;
				}
			}

			this._reg.delete(id);
			this._dirtyReg = true;
		}
	}

	private _stripId(bkts: Bkts | undefined, id: string): void {
		if (!bkts) return;
		for (const bkt of bkts) {
			if (!bkt) continue;
			const pos = bkt.indexOf(id);
			if (pos !== -1) bkt.splice(pos, 1);
		}
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Private — search helpers
	// ─────────────────────────────────────────────────────────────────────────

	/** Build { id → highestStoredScore } from score-buckets. */
	private _toScoreMap(bkts: Bkts, res: number): Map<string, number> {
		const m = new Map<string, number>();
		for (let i = 0; i < bkts.length; i++) {
			const bkt = bkts[i];
			if (!bkt?.length) continue;
			// Stored score mirrors FlexSearch/Redis convention: score = res - bucketIndex
			const score = res - i;
			for (const id of bkt) {
				if ((m.get(id) ?? -1) < score) m.set(id, score);
			}
		}
		return m;
	}

	/**
	 * Intersection with MAX aggregate.
	 * Mirrors `ZINTERSTORE AGGREGATE MAX` from the Redis adapter.
	 * Iterates the smallest map first: O(|A| × |maps|) where |A| is smallest.
	 */
	private _intersect(maps: Map<string, number>[]): Map<string, number> {
		if (maps.length === 1) return maps[0];
		maps.sort((a, b) => a.size - b.size);

		const out = new Map<string, number>();
		next: for (const [id, s0] of maps[0]) {
			let max = s0;
			for (let k = 1; k < maps.length; k++) {
				const s = maps[k].get(id);
				if (s === undefined) continue next; // not in all terms → skip
				if (s > max) max = s;
			}
			out.set(id, max);
		}
		return out;
	}

	/**
	 * Suggest-mode merge.
	 *
	 * Replicates the Redis adapter's two-step ZINTERSTORE + ZUNIONSTORE trick:
	 *
	 *  1. Union all score maps (SUM) → every matched id gets a base score
	 *     proportional to how many terms it matched and at what relevance.
	 *
	 *  2. Compute inter-section score (SUM) for ids present in ALL terms,
	 *     then boost those ids by (n × intersectionSum), making them rise
	 *     decisively above partial matches in the final ranking.
	 */
	private _suggest(maps: Map<string, number>[]): Map<string, number> {
		const n = maps.length;

		// Step 1: full union with SUM
		const union = new Map<string, number>();
		for (const m of maps) {
			for (const [id, s] of m) {
				union.set(id, (union.get(id) ?? 0) + s);
			}
		}

		// Step 2: intersect (SUM) and apply boost
		maps.sort((a, b) => a.size - b.size);
		next: for (const [id, s0] of maps[0]) {
			let sum = s0;
			for (let k = 1; k < maps.length; k++) {
				const s = maps[k].get(id);
				if (s === undefined) continue next;
				sum += s;
			}
			// n × intersectionSum is added on top of the id's union score
			union.set(id, (union.get(id) ?? 0) + sum * n);
		}

		return union;
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Private — output helpers
	// ─────────────────────────────────────────────────────────────────────────

	private _typed(id: string): string | number {
		return this.type === 'number' ? parseInt(id, 10) : id;
	}

	/**
	 * Flatten score-buckets into an ordered list, apply limit/offset, then
	 * return either a flat array (resolve=true) or a re-bucketed array of
	 * arrays (resolve=false) matching FlexSearch's internal format.
	 */
	private _materialise(
		bkts: Bkts,
		limit: number,
		offset: number,
		resolve: boolean,
		res: number,
	): any[] {
		const flat: { id: string; score: number }[] = [];
		for (let i = 0; i < bkts.length; i++) {
			const bkt = bkts[i];
			if (!bkt?.length) continue;
			const score = res - i;
			for (const id of bkt) flat.push({ id, score });
		}

		const page = flat.slice(offset, limit ? offset + limit : undefined);

		if (resolve) return page.map((x) => this._typed(x.id));

		const out: any[][] = [];
		for (const { id, score } of page) {
			const bi = Math.max(res - score, 0);
			(out[bi] ??= []).push(this._typed(id));
		}
		return out;
	}

	/** Apply enrich() over a flat (resolve=true) or bucketed (resolve=false) result. */
	private _enrichItems(result: any, resolve: boolean): any {
		if (resolve) return this.enrich(result as string[]);
		return (result as string[][]).map((bkt) => (bkt ? this.enrich(bkt) : undefined));
	}

	/**
	 * Resolve tag filter pairs ([name, value, name, value, ...]) into
	 * Sets of doc-ids so that search() can apply them as intersect filters.
	 *
	 * Tries several key formats to cover different FlexSearch Document
	 * field-tag conventions.
	 */
	private _resolveTagSets(tags: any[]): Set<string>[] {
		const sets: Set<string>[] = [];
		for (let i = 0; i + 1 < tags.length; i += 2) {
			const name = String(tags[i]);
			const value = String(tags[i + 1]);
			const ids =
				this._tag.get(`${name}:${value}`) ??
				this._tag.get(value) ??
				this._tag.get(`${sanitize(name)}:${value}`);
			if (ids) sets.push(new Set(ids));
		}
		return sets;
	}

	/**
	 * Iterate a FlexSearch registry which may be a Set<id> or a Map<id, *>.
	 * Returns string-coerced ids in both cases.
	 */
	private _iterReg(reg: Set<any> | Map<any, any>): string[] {
		if (reg instanceof Set) return [...reg].map(String);
		if (reg instanceof Map) return [...reg.keys()].map(String);
		return [];
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Private — I/O
	// ─────────────────────────────────────────────────────────────────────────

	private async _loadShard(
		path: string,
		hydrate: (data: unknown) => void,
	): Promise<void> {
		try {
			const buf = await this._fs.get(path);
			if (buf) hydrate(decode(buf));
		} catch {
			// Missing or corrupt shard → treat as empty.
			// This handles both first-run (no files yet) and partial storage failures.
		}
	}

	/**
	 * Write every dirty shard to the file store in parallel, then clear
	 * all dirty-set entries.
	 *
	 * Wall-clock cost = max(slowest single shard write), not Σ(all writes).
	 * Empty shards are deleted from the file store rather than written as
	 * empty objects; this also evicts dead in-memory entries.
	 */
	private async _flush(): Promise<void> {
		const writes: Promise<void>[] = [];

		// ── map shards ────────────────────────────────────────────────────────
		for (const i of this._dm) {
			const data: Record<string, Bkts> = {};
			for (const [term, bkts] of this._map[i]) {
				const trimmed = trimBuckets(bkts);
				if (trimmed.length) {
					data[term] = trimmed;
				} else {
					this._map[i].delete(term); // evict fully-drained entry
				}
			}
			writes.push(
				Object.keys(data).length
					? this._fs.write(this._pMap(i), encode(data))
					: this._fs.delete([this._pMap(i)]),
			);
		}
		this._dm.clear();

		// ── ctx shards ────────────────────────────────────────────────────────
		for (const i of this._dc) {
			const data: Record<string, Record<string, Bkts>> = {};
			for (const [ct, inner] of this._ctx[i]) {
				const innerData: Record<string, Bkts> = {};
				for (const [term, bkts] of inner) {
					const trimmed = trimBuckets(bkts);
					if (trimmed.length) {
						innerData[term] = trimmed;
					} else {
						inner.delete(term);
					}
				}
				if (Object.keys(innerData).length) {
					data[ct] = innerData;
				} else {
					this._ctx[i].delete(ct);
				}
			}
			writes.push(
				Object.keys(data).length
					? this._fs.write(this._pCtx(i), encode(data))
					: this._fs.delete([this._pCtx(i)]),
			);
		}
		this._dc.clear();

		// ── store shards ──────────────────────────────────────────────────────
		for (const i of this._ds) {
			writes.push(
				this._store[i].size
					? this._fs.write(
							this._pStore(i),
							encode(Object.fromEntries(this._store[i])),
						)
					: this._fs.delete([this._pStore(i)]),
			);
		}
		this._ds.clear();

		// ── ref shards ────────────────────────────────────────────────────────
		for (const i of this._dr) {
			const data: Record<string, string[]> = {};
			for (const [id, refs] of this._ref[i]) {
				if (refs.size) data[id] = [...refs];
			}
			writes.push(
				Object.keys(data).length
					? this._fs.write(this._pRef(i), encode(data))
					: this._fs.delete([this._pRef(i)]),
			);
		}
		this._dr.clear();

		// ── registry (single file) ────────────────────────────────────────────
		if (this._dirtyReg) {
			writes.push(
				this._reg.size
					? this._fs.write(this._pReg(), encode([...this._reg]))
					: this._fs.delete([this._pReg()]),
			);
			this._dirtyReg = false;
		}

		// ── tags (single file) ────────────────────────────────────────────────
		if (this._dirtyTag) {
			writes.push(
				this._tag.size
					? this._fs.write(this._pTag(), encode(Object.fromEntries(this._tag)))
					: this._fs.delete([this._pTag()]),
			);
			this._dirtyTag = false;
		}

		// All writes race concurrently; we wait for the slowest one.
		await Promise.all(writes);
	}
}
