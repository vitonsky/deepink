/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable @cspell/spellchecker */
/* eslint-disable no-bitwise */
/**
 * FlexSearch LRU write-back file storage adapter.
 *
 * All index data is demand-paged through a bounded LRU cache.
 * Only the tag store is kept wholly in RAM (it is a single small file).
 * Everything else — map, ctx, store, ref, reg — is split into shards that
 * are loaded on first access and evicted when the cache is full.
 *
 * Write-back policy: mutations are applied to the cached shard in-memory and
 * flushed to the file store only on commit(), close(), or shard eviction.
 *
 * Multi-shard operations (search, commit, remove) preload all required shards
 * in parallel before touching any of them, so wall-clock I/O cost equals the
 * slowest single shard, not the sum of all shards.
 *
 * ─── Root-cause fixes vs the original ────────────────────────────────────────
 *
 *  Bug 1 — Microtask eviction racing with in-progress operations.
 *    The original `_scheduleEagerEviction` used `Promise.resolve().then()`, a
 *    microtask.  Microtasks run between successive `await` points inside a
 *    single async operation.  During a `commit()` or `remove()` call that
 *    loaded shards with `await Promise.all([…])` and then accessed them
 *    synchronously, the eager-eviction microtask could fire *between* those
 *    two steps and evict the freshly loaded shards before they were used.
 *    Fix: changed to `setTimeout` (macrotask), which never fires mid-operation.
 *
 *  Bug 2 — Non-null assertions on potentially-evicted cache entries.
 *    Every multi-shard operation called `this._xSync(si)!` after the parallel
 *    load, trusting silently that the shard was still in the cache.  When
 *    Bug 1 evicted it, the lookup returned `undefined`; the `!` hid this, and
 *    the subsequent `.get()` / `.delete()` on `undefined` produced the
 *    TypeError crashes.
 *    Fix: `_loadShards()` now returns a local `Map<shardIndex, data>` so
 *    callers hold direct references to loaded data and never re-query the cache.
 */

import type { IFilesStorage } from '@core/features/files';

// ─── shard configuration ─────────────────────────────────────────────────────

export interface ShardConfig {
	/** Inverted-index shards.  Target: ≤ 1 MB per shard file. */
	readonly map: number; // default 256
	/** Context-pair index shards. */
	readonly ctx: number; // default 256
	/** Document-store shards (larger payload per entry). */
	readonly store: number; // default 1024
	/** Reverse-reference index shards. */
	readonly ref: number; // default 256
	/** Registry (all known doc-ids) shards. */
	readonly reg: number; // default 64
}

const DEFAULT_SHARDS: ShardConfig = {
	map: 256,
	ctx: 256,
	store: 1024,
	ref: 256,
	reg: 64,
};

// ─── binary codec ─────────────────────────────────────────────────────────────

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/** Version byte written at the start of every serialised shard. */
const SHARD_VERSION = 1;
const ID_ENCODING_STRING = 0; // uint16-length-prefixed UTF-8
const ID_ENCODING_UINT32 = 1; // uint32 little-endian (numeric IDs ≤ 2³²–1)

class BinaryWriter {
	private _buf: Uint8Array;
	private _view: DataView;
	private _pos = 0;

	constructor(initialCapacity = 65_536) {
		this._buf = new Uint8Array(initialCapacity);
		this._view = new DataView(this._buf.buffer);
	}

	private _reserve(bytes: number): void {
		if (this._pos + bytes <= this._buf.length) return;
		const next = new Uint8Array(Math.max(this._buf.length * 2, this._pos + bytes));
		next.set(this._buf);
		this._buf = next;
		this._view = new DataView(this._buf.buffer);
	}

	u8(v: number): this {
		this._reserve(1);
		this._buf[this._pos++] = v & 0xff;
		return this;
	}

	u16(v: number): this {
		this._reserve(2);
		this._view.setUint16(this._pos, v, /* littleEndian */ true);
		this._pos += 2;
		return this;
	}

	u32(v: number): this {
		this._reserve(4);
		this._view.setUint32(this._pos, v >>> 0, /* littleEndian */ true);
		this._pos += 4;
		return this;
	}

	bytes(data: Uint8Array): this {
		this._reserve(data.length);
		this._buf.set(data, this._pos);
		this._pos += data.length;
		return this;
	}

	/** Writes a uint16-length-prefixed UTF-8 string (max 65 535 bytes). */
	string(s: string): this {
		const encoded = TEXT_ENCODER.encode(s);
		return this.u16(encoded.length).bytes(encoded);
	}

	/** Returns a new `ArrayBuffer` containing exactly the bytes written so far. */
	toBuffer(): ArrayBuffer {
		return this._buf.buffer.slice(0, this._pos) as ArrayBuffer;
	}
}

class BinaryReader {
	private readonly _buf: Uint8Array;
	private readonly _view: DataView;
	private _pos = 0;

	constructor(buf: ArrayBuffer) {
		this._buf = new Uint8Array(buf);
		this._view = new DataView(buf);
	}

	u8(): number {
		return this._buf[this._pos++];
	}

	u16(): number {
		const v = this._view.getUint16(this._pos, /* littleEndian */ true);
		this._pos += 2;
		return v;
	}

	u32(): number {
		const v = this._view.getUint32(this._pos, /* littleEndian */ true);
		this._pos += 4;
		return v;
	}

	string(): string {
		const len = this.u16();
		const s = TEXT_DECODER.decode(this._buf.subarray(this._pos, this._pos + len));
		this._pos += len;
		return s;
	}

	/** Reads a document ID: numeric string for uint32 encoding, UTF-8 otherwise. */
	id(numericIds: boolean): string {
		return numericIds ? String(this.u32()) : this.string();
	}
}

// ─── shard data types ─────────────────────────────────────────────────────────

/** Score-buckets: index 0 = highest relevance. */
type ScoreBuckets = string[][];

type MapShardData = Map<string, ScoreBuckets>;
type CtxShardData = Map<string, MapShardData>;
type StoreShardData = Map<string, unknown>;
type RefShardData = Map<string, Set<string>>;
type RegShardData = Set<string>;

type ShardCat = 'map' | 'ctx' | 'store' | 'ref' | 'reg';

/**
 * Maps each shard category to its concrete data type.
 * Used in `_loadShard<C>` so callers always receive the correct concrete type
 * without a type assertion at every call site.
 */
type ShardDataFor<C extends ShardCat> = C extends 'map'
	? MapShardData
	: C extends 'ctx'
		? CtxShardData
		: C extends 'store'
			? StoreShardData
			: C extends 'ref'
				? RefShardData
				: C extends 'reg'
					? RegShardData
					: never;

/**
 * Discriminated union for the LRU cache.
 *
 * Narrowing on `cat` gives TypeScript precise knowledge of `data`'s type,
 * eliminating type assertions in the encode and decode paths.
 */
type CacheEntry =
	| { cat: 'map'; data: MapShardData; dirty: boolean }
	| { cat: 'ctx'; data: CtxShardData; dirty: boolean }
	| { cat: 'store'; data: StoreShardData; dirty: boolean }
	| { cat: 'ref'; data: RefShardData; dirty: boolean }
	| { cat: 'reg'; data: RegShardData; dirty: boolean };

// ─── per-category codec functions ─────────────────────────────────────────────

function writeScoreBuckets(
	w: BinaryWriter,
	buckets: ScoreBuckets,
	numericIds: boolean,
): void {
	const nonEmpty: [number, string[]][] = [];
	for (let i = 0; i < buckets.length; i++) {
		if (buckets[i]?.length) nonEmpty.push([i, buckets[i]]);
	}
	w.u8(nonEmpty.length);
	for (const [bucketIndex, ids] of nonEmpty) {
		w.u8(bucketIndex).u32(ids.length);
		for (const id of ids) numericIds ? w.u32(parseInt(id, 10)) : w.string(id);
	}
}

function readScoreBuckets(r: BinaryReader, numericIds: boolean): ScoreBuckets {
	const count = r.u8();
	const buckets: ScoreBuckets = [];
	for (let b = 0; b < count; b++) {
		const index = r.u8();
		const n = r.u32();
		const ids = new Array<string>(n);
		for (let i = 0; i < n; i++) ids[i] = r.id(numericIds);
		buckets[index] = ids;
	}
	return buckets;
}

// ── map ───────────────────────────────────────────────────────────────────────

function encodeMapShard(data: MapShardData, numericIds: boolean): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(SHARD_VERSION)
		.u8(numericIds ? ID_ENCODING_UINT32 : ID_ENCODING_STRING)
		.u32(data.size);
	for (const [term, buckets] of data) {
		w.string(term);
		writeScoreBuckets(w, buckets, numericIds);
	}
	return w.toBuffer();
}

function decodeMapShard(buf: ArrayBuffer): MapShardData {
	const r = new BinaryReader(buf);
	r.u8(); // version
	const numericIds = r.u8() === ID_ENCODING_UINT32;
	const n = r.u32();
	const out: MapShardData = new Map();
	for (let i = 0; i < n; i++) out.set(r.string(), readScoreBuckets(r, numericIds));
	return out;
}

// ── ctx ───────────────────────────────────────────────────────────────────────

function encodeCtxShard(data: CtxShardData, numericIds: boolean): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(SHARD_VERSION)
		.u8(numericIds ? ID_ENCODING_UINT32 : ID_ENCODING_STRING)
		.u32(data.size);
	for (const [ctTerm, inner] of data) {
		w.string(ctTerm).u32(inner.size);
		for (const [term, buckets] of inner) {
			w.string(term);
			writeScoreBuckets(w, buckets, numericIds);
		}
	}
	return w.toBuffer();
}

function decodeCtxShard(buf: ArrayBuffer): CtxShardData {
	const r = new BinaryReader(buf);
	r.u8(); // version
	const numericIds = r.u8() === ID_ENCODING_UINT32;
	const n = r.u32();
	const out: CtxShardData = new Map();
	for (let i = 0; i < n; i++) {
		const ctTerm = r.string();
		const count = r.u32();
		const inner: MapShardData = new Map();
		for (let j = 0; j < count; j++)
			inner.set(r.string(), readScoreBuckets(r, numericIds));
		out.set(ctTerm, inner);
	}
	return out;
}

// ── ref ───────────────────────────────────────────────────────────────────────

function encodeRefShard(data: RefShardData, numericIds: boolean): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(SHARD_VERSION)
		.u8(numericIds ? ID_ENCODING_UINT32 : ID_ENCODING_STRING)
		.u32(data.size);
	for (const [id, refs] of data) {
		numericIds ? w.u32(parseInt(id, 10)) : w.string(id);
		w.u16(refs.size);
		for (const ref of refs) w.string(ref);
	}
	return w.toBuffer();
}

function decodeRefShard(buf: ArrayBuffer): RefShardData {
	const r = new BinaryReader(buf);
	r.u8(); // version
	const numericIds = r.u8() === ID_ENCODING_UINT32;
	const n = r.u32();
	const out: RefShardData = new Map();
	for (let i = 0; i < n; i++) {
		const id = r.id(numericIds);
		const count = r.u16();
		const refs = new Set<string>();
		for (let j = 0; j < count; j++) refs.add(r.string());
		out.set(id, refs);
	}
	return out;
}

// ── reg ───────────────────────────────────────────────────────────────────────

function encodeRegShard(data: RegShardData, numericIds: boolean): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(SHARD_VERSION)
		.u8(numericIds ? ID_ENCODING_UINT32 : ID_ENCODING_STRING)
		.u32(data.size);
	for (const id of data) numericIds ? w.u32(parseInt(id, 10)) : w.string(id);
	return w.toBuffer();
}

function decodeRegShard(buf: ArrayBuffer): RegShardData {
	const r = new BinaryReader(buf);
	r.u8(); // version
	const numericIds = r.u8() === ID_ENCODING_UINT32;
	const n = r.u32();
	const out: RegShardData = new Set();
	for (let i = 0; i < n; i++) out.add(r.id(numericIds));
	return out;
}

// ── JSON (store, tags) ────────────────────────────────────────────────────────

function encodeJSON(v: unknown): ArrayBuffer {
	return TEXT_ENCODER.encode(JSON.stringify(v)).buffer;
}

function decodeJSON<T>(buf: ArrayBuffer): T {
	return JSON.parse(TEXT_DECODER.decode(buf));
}

// ─── utilities ────────────────────────────────────────────────────────────────

/** djb2-inspired hash; deterministically maps a string key to a shard index. */
function shardIndex(key: string, shardCount: number): number {
	let h = 5381;
	for (let i = 0; i < key.length; i++) {
		h = (Math.imul(h, 33) ^ key.charCodeAt(i)) | 0;
	}
	return (h >>> 0) % shardCount;
}

/** Strip characters unsafe in path components. */
function sanitizeName(s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

/**
 * Returns `map.get(key)` when present, otherwise inserts `init()` and returns
 * the new value.  Mirrors Rust's `entry().or_insert_with()`.
 */
function getOrInit<K, V>(map: Map<K, V>, key: K, init: () => V): V {
	let value = map.get(key);
	if (value === undefined) {
		value = init();
		map.set(key, value);
	}
	return value;
}

/**
 * Group a `Map<string, V>` by `shardIndex(key, shardCount)`.
 * Placed at module level so it carries no instance reference.
 */
function groupByShard<V>(
	src: Map<string, V>,
	shardCount: number,
): Map<number, Map<string, V>> {
	const out = new Map<number, Map<string, V>>();
	for (const [key, val] of src) {
		getOrInit(out, shardIndex(key, shardCount), () => new Map()).set(key, val);
	}
	return out;
}

// ─── FlexSearch protocol types ────────────────────────────────────────────────

/** A pending deletion task enqueued by FlexSearch between commits. */
interface FlexCommitTask {
	readonly del?: string | number;
}

/**
 * The in-memory accumulators that FlexSearch passes to `commit()`.
 * `commit()` drains these and writes them to persistent shards.
 */
interface FlexCommitState {
	commit_task?: FlexCommitTask[];
	reg?: Set<string | number> | Map<string | number, unknown>;
	map?: Map<string, ScoreBuckets>;
	ctx?: Map<string, Map<string, ScoreBuckets>>;
	store?: Map<string | number, unknown>;
	tag?: Map<string, (string | number)[]>;
	readonly bypass?: boolean;
	readonly document?: boolean;
}

/** The shape of a FlexSearch `Index` passed to `mount()`. */
interface FlexSearchIndex {
	db?: any;
	/** Non-null for a FlexSearch `Document` index (wraps nested plain indexes). */
	readonly index?: unknown;
	mount?: (db: FlexSearchStorage) => Promise<void>;
	resolution?: number;
	resolution_ctx?: number;
	bidirectional?: boolean;
}

/** Options object received by `search()` — a sub-set of `FlexSearchIndex`. */
interface SearchOptions {
	readonly depth?: number | boolean;
	readonly bidirectional?: boolean;
}

// ─── main class ───────────────────────────────────────────────────────────────

export class FlexSearchStorage {
	// ── FlexSearch adapter protocol ───────────────────────────────────────────
	//
	// These public fields satisfy the FlexSearch storage-adapter duck-type
	// contract.  The snake_case names match the FlexSearch protocol exactly.

	public readonly support_tag_search = true;
	public readonly fastupdate = true;
	public resolution_ctx = 9;

	public resolution = 9;
	/** Back-reference to the storage backend; required by FlexSearch protocol. */
	public db: any;
	/**
	 * Detected ID encoding: `''` until the first document is indexed, then
	 * `'number'` when numeric IDs are encountered.  Do not set manually.
	 */
	public type: '' | 'number' = '';

	// ── private state ─────────────────────────────────────────────────────────

	private readonly _storage: IFilesStorage;
	private readonly _name: string;
	private readonly _field: string;
	private readonly _shards: ShardConfig;
	private readonly _maxCache: number;

	/**
	 * LRU cache keyed by shard path.
	 * Map preserves insertion order — Map-start = LRU end, Map-end = MRU end.
	 * `_touchEntry()` promotes an entry to the MRU end.
	 */
	private readonly _cache = new Map<string, CacheEntry>();

	/**
	 * Deduplicates concurrent loads of the same path.
	 * When multiple async operations miss on the same key, only one file read
	 * is issued; all waiters share the same Promise.
	 */
	private readonly _inflightLoads = new Map<string, Promise<CacheEntry>>();

	/** Tags kept fully in RAM — single small file, queried on every tag search. */
	private readonly _tags = new Map<string, string[]>();
	private _tagsDirty = false;

	private _isOpen = false;
	private _bidirectional = false;
	private _eagerEvictScheduled = false;

	// ── constructor ───────────────────────────────────────────────────────────

	constructor(
		storage: IFilesStorage,
		name: string | { name?: string; field?: string } = 'flexsearch',
		config: {
			field?: string;
			shards?: Partial<ShardConfig>;
			cacheSize?: number;
		} = {},
	) {
		this._storage = storage;

		if (typeof name === 'string') {
			this._name = sanitizeName(name) || 'flexsearch';
			this._field = config.field ? `-${sanitizeName(config.field)}` : '';
		} else {
			this._name = sanitizeName(name.name ?? 'flexsearch') || 'flexsearch';
			this._field = name.field ? `-${sanitizeName(name.field)}` : '';
		}

		this._shards = { ...DEFAULT_SHARDS, ...config.shards };
		this._maxCache = config.cacheSize ?? 128;
	}

	// ── path helpers ──────────────────────────────────────────────────────────

	private _mapPath(i: number): string {
		return `/${this._name}/map${this._field}/${i}`;
	}
	private _ctxPath(i: number): string {
		return `/${this._name}/ctx${this._field}/${i}`;
	}
	private _storePath(i: number): string {
		return `/${this._name}/store/${i}`;
	}
	private _refPath(i: number): string {
		return `/${this._name}/ref${this._field}/${i}`;
	}
	private _regPath(i: number): string {
		return `/${this._name}/reg/${i}`;
	}
	private _tagPath(): string {
		return `/${this._name}/tag${this._field}`;
	}

	// ── LRU cache management ──────────────────────────────────────────────────

	/**
	 * Promote the entry at `path` to the MRU position and return it,
	 * or return `undefined` on a cache miss.
	 */
	private _touchEntry(path: string): CacheEntry | undefined {
		const entry = this._cache.get(path);
		if (!entry) return undefined;
		// Re-inserting to Map-end is the O(1) LRU promotion.
		this._cache.delete(path);
		this._cache.set(path, entry);
		return entry;
	}

	private _markDirty(path: string): void {
		const entry = this._cache.get(path);
		if (entry) entry.dirty = true;
	}

	// ── shard loading ─────────────────────────────────────────────────────────

	/**
	 * Load a shard from storage and insert it into the LRU cache.
	 * Concurrent requests for the same path are coalesced into one file read.
	 */
	private _loadEntry(path: string, cat: ShardCat): Promise<CacheEntry> {
		const inflight = this._inflightLoads.get(path);
		if (inflight) return inflight;

		const promise = (async (): Promise<CacheEntry> => {
			if (this._cache.size >= this._maxCache) await this._evictOne(path);
			const buf = await this._storage.get(path);
			const entry = buf ? this._decodeEntry(cat, buf) : this._emptyEntry(cat);
			this._cache.set(path, entry);
			this._scheduleEagerEviction();
			return entry;
		})();

		this._inflightLoads.set(path, promise);
		promise.finally(() => this._inflightLoads.delete(path));
		return promise;
	}

	/**
	 * Return a shard's typed data, loading from storage if necessary.
	 *
	 * The single type assertion `entry.data as ShardDataFor<C>` is safe by
	 * architectural contract: every shard path is owned by exactly one category
	 * (_mapPath → 'map', _ctxPath → 'ctx', etc.), so `entry.data` is always
	 * the correct concrete type for the given `C`.  TypeScript cannot prove this
	 * from the call graph alone, hence this one guarded assertion rather than
	 * scattered casts throughout the codebase.
	 */
	private async _loadShard<C extends ShardCat>(
		path: string,
		cat: C,
	): Promise<ShardDataFor<C>> {
		const cached = this._touchEntry(path);
		const entry = cached ?? (await this._loadEntry(path, cat));
		return entry.data as ShardDataFor<C>;
	}

	// ── typed shard accessors ─────────────────────────────────────────────────

	private _mapShard(si: number): Promise<MapShardData> {
		return this._loadShard(this._mapPath(si), 'map');
	}
	private _ctxShard(si: number): Promise<CtxShardData> {
		return this._loadShard(this._ctxPath(si), 'ctx');
	}
	private _storeShard(si: number): Promise<StoreShardData> {
		return this._loadShard(this._storePath(si), 'store');
	}
	private _refShard(si: number): Promise<RefShardData> {
		return this._loadShard(this._refPath(si), 'ref');
	}
	private _regShard(si: number): Promise<RegShardData> {
		return this._loadShard(this._regPath(si), 'reg');
	}

	// ── parallel load helper ──────────────────────────────────────────────────

	/**
	 * Load multiple shards in parallel, returning `Map<shardIndex, data>`.
	 *
	 * Callers hold direct references to the loaded data.  This makes downstream
	 * code immune to any cache eviction that occurs after the `await` — the
	 * root cause of the original TypeError crashes (see module-level comment).
	 */
	private async _loadShards<D>(
		indices: Iterable<number>,
		loader: (si: number) => Promise<D>,
	): Promise<Map<number, D>> {
		const pairs = await Promise.all(
			[...indices].map(async (si): Promise<[number, D]> => [si, await loader(si)]),
		);
		return new Map(pairs);
	}

	// ── eviction ──────────────────────────────────────────────────────────────

	/**
	 * Evict one shard from the cache.
	 * Prefers the LRU *clean* entry (no disk write needed).
	 * Falls back to the LRU *dirty* entry only when every entry is dirty.
	 * Never evicts `skipPath` (the path currently being loaded).
	 */
	private async _evictOne(skipPath: string): Promise<void> {
		let cleanTarget: string | undefined;
		let dirtyTarget: string | undefined;
		let dirtyEntry: CacheEntry | undefined;

		for (const [path, entry] of this._cache) {
			if (path === skipPath) continue;
			if (!entry.dirty) {
				cleanTarget = path;
				break;
			}
			dirtyTarget ??= path;
			dirtyEntry ??= entry;
		}

		if (cleanTarget !== undefined) {
			this._cache.delete(cleanTarget);
			return;
		}
		if (dirtyTarget !== undefined && dirtyEntry !== undefined) {
			this._cache.delete(dirtyTarget);
			await this._writeToDisk(dirtyTarget, dirtyEntry);
		}
	}

	/**
	 * Trim the cache to 70 % of its limit when it exceeds 80 %, scheduled as
	 * a `setTimeout` macrotask.
	 *
	 * The original code used `Promise.resolve().then()` (a microtask).
	 * Microtasks execute between successive `await` points inside a single async
	 * call.  Changing to `setTimeout` ensures eviction never runs mid-operation:
	 * the callback fires only after the current `commit()` / `remove()` and all
	 * its microtasks have fully completed.
	 *
	 * Only clean entries are removed here — dirty entries require a disk write
	 * and are handled by `_evictOne` or `_flush` instead.
	 */
	private _scheduleEagerEviction(): void {
		if (
			this._eagerEvictScheduled ||
			this._cache.size <= Math.floor(this._maxCache * 0.8)
		) {
			return;
		}
		this._eagerEvictScheduled = true;
		setTimeout(() => {
			try {
				const target = Math.floor(this._maxCache * 0.7);
				for (const [path, entry] of this._cache) {
					if (this._cache.size <= target) break;
					if (!entry.dirty) this._cache.delete(path);
				}
			} finally {
				this._eagerEvictScheduled = false;
			}
		}, 0);
	}

	// ── persistence ───────────────────────────────────────────────────────────

	/** Flush all dirty shards and the tag file to storage in parallel. */
	private async _flush(): Promise<void> {
		const writes: Promise<void>[] = [];

		for (const [path, entry] of this._cache) {
			if (!entry.dirty) continue;
			// Mark clean before awaiting to prevent double-flush on re-entrant calls.
			entry.dirty = false;
			writes.push(this._writeToDisk(path, entry));
		}

		if (this._tagsDirty) {
			this._tagsDirty = false;
			writes.push(this._flushTags());
		}

		await Promise.all(writes);
	}

	private async _writeToDisk(path: string, entry: CacheEntry): Promise<void> {
		if (entry.data.size === 0) {
			try {
				await this._storage.delete([path]);
			} catch {
				/* file was already absent — nothing to do */
			}
		} else {
			await this._storage.write(path, this._encodeEntry(entry));
		}
	}

	private async _flushTags(): Promise<void> {
		if (this._tags.size > 0) {
			await this._storage.write(
				this._tagPath(),
				encodeJSON(Object.fromEntries(this._tags)),
			);
		} else {
			try {
				await this._storage.delete([this._tagPath()]);
			} catch {
				/* file was already absent — nothing to do */
			}
		}
	}

	// ── codec dispatch ────────────────────────────────────────────────────────

	/**
	 * Encode a cache entry to its on-disk binary form.
	 *
	 * Switching on `entry.cat` lets TypeScript narrow `entry.data` to the
	 * correct concrete type in every branch — no type assertions required.
	 */
	private _encodeEntry(entry: CacheEntry): ArrayBuffer {
		const numericIds = this.type === 'number';
		switch (entry.cat) {
			case 'map':
				return encodeMapShard(entry.data, numericIds);
			case 'ctx':
				return encodeCtxShard(entry.data, numericIds);
			case 'store':
				return encodeJSON(Object.fromEntries(entry.data));
			case 'ref':
				return encodeRefShard(entry.data, numericIds);
			case 'reg':
				return encodeRegShard(entry.data, numericIds);
		}
	}

	/**
	 * Decode an `ArrayBuffer` from storage into a typed cache entry.
	 *
	 * Each branch constructs a narrowed discriminated-union member, so
	 * TypeScript verifies the assignment to `CacheEntry` without assertions.
	 */
	private _decodeEntry(cat: ShardCat, buf: ArrayBuffer): CacheEntry {
		switch (cat) {
			case 'map':
				return { cat, data: decodeMapShard(buf), dirty: false };
			case 'ctx':
				return { cat, data: decodeCtxShard(buf), dirty: false };
			case 'store':
				return {
					cat,
					data: new Map(
						Object.entries(decodeJSON<Record<string, unknown>>(buf)),
					),
					dirty: false,
				};
			case 'ref':
				return { cat, data: decodeRefShard(buf), dirty: false };
			case 'reg':
				return { cat, data: decodeRegShard(buf), dirty: false };
		}
	}

	private _emptyEntry(cat: ShardCat): CacheEntry {
		switch (cat) {
			case 'map':
				return { cat, data: new Map<string, ScoreBuckets>(), dirty: false };
			case 'ctx':
				return { cat, data: new Map<string, MapShardData>(), dirty: false };
			case 'store':
				return { cat, data: new Map<string, unknown>(), dirty: false };
			case 'ref':
				return { cat, data: new Map<string, Set<string>>(), dirty: false };
			case 'reg':
				return { cat, data: new Set<string>(), dirty: false };
		}
	}

	// ── lifecycle ─────────────────────────────────────────────────────────────

	async mount(index: FlexSearchIndex): Promise<void> {
		// A FlexSearch `Document` index delegates to its child plain indexes;
		// FlexSearch calls `mount` on each child itself.
		if (index.index) {
			await index.mount?.(this);
			return;
		}

		index.db = this;
		this.resolution = index.resolution ?? this.resolution;
		this.resolution_ctx = index.resolution_ctx ?? this.resolution_ctx;
		this._bidirectional = index.bidirectional ?? false;
		await this.open();
	}

	async open(): Promise<void> {
		if (this._isOpen) return;
		this._isOpen = true;
		// Only the tag store is eagerly loaded; all other shards are demand-paged.
		const buf = await this._storage.get(this._tagPath());
		if (buf) {
			for (const [k, v] of Object.entries(
				decodeJSON<Record<string, string[]>>(buf),
			)) {
				this._tags.set(k, v);
			}
		}
	}

	async close(): Promise<void> {
		await this._flush();
		this._isOpen = false;
	}

	async destroy(): Promise<void> {
		return this.clear();
	}

	async clear(): Promise<void> {
		this._cache.clear();
		this._tags.clear();
		this._tagsDirty = false;

		const prefix = `/${this._name}/`;
		const all = await this._storage.list();
		const ours = all.filter((p) => p.startsWith(prefix));
		if (ours.length) await this._storage.delete(ours);
	}

	// ── commit() ──────────────────────────────────────────────────────────────

	async commit(state: FlexCommitState): Promise<void> {
		// ① Drain pending deletions first.
		const tasks = state.commit_task ?? [];
		state.commit_task = [];

		const pendingDeletes = tasks
			.filter((t): t is { del: string | number } => t.del != null)
			.map((t) => String(t.del));

		if (pendingDeletes.length) await this._removeBatch(pendingDeletes);
		if (!state.reg?.size && !pendingDeletes.length) return;

		// `pendingRefs` accumulates (docId → refKeys) as map and ctx shards are
		// written.  After both passes the ref shards are updated in one batch.
		const pendingRefs = new Map<string, Set<string>>();

		// ② map shards — coalesced by shard index.
		if (state.map?.size) {
			const byShard = groupByShard(state.map, this._shards.map);
			const shards = await this._loadShards(byShard.keys(), (si) =>
				this._mapShard(si),
			);
			for (const [si, terms] of byShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const [term, buckets] of terms) {
					this._mergeScoreBuckets(
						data,
						term,
						buckets,
						`map|${term}`,
						pendingRefs,
					);
				}
				this._markDirty(this._mapPath(si));
			}
		}

		// ③ ctx shards — coalesced by shard index.
		if (state.ctx?.size) {
			const byShard = groupByShard(state.ctx, this._shards.ctx);
			const shards = await this._loadShards(byShard.keys(), (si) =>
				this._ctxShard(si),
			);
			for (const [si, ctxEntries] of byShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const [ctTerm, innerMap] of ctxEntries) {
					const inner = getOrInit(
						data,
						ctTerm,
						() => new Map<string, ScoreBuckets>(),
					);
					for (const [term, buckets] of innerMap) {
						this._mergeScoreBuckets(
							inner,
							term,
							buckets,
							`ctx|${ctTerm}|${term}`,
							pendingRefs,
						);
					}
				}
				this._markDirty(this._ctxPath(si));
			}
		}

		// ④ ref shards — one pass over pendingRefs, batched by shard index.
		if (pendingRefs.size) {
			const byRefShard = new Map<number, Map<string, Set<string>>>();
			for (const [docId, refKeys] of pendingRefs) {
				getOrInit(
					byRefShard,
					shardIndex(docId, this._shards.ref),
					() => new Map(),
				).set(docId, refKeys);
			}
			const shards = await this._loadShards(byRefShard.keys(), (si) =>
				this._refShard(si),
			);
			for (const [si, updates] of byRefShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const [docId, refKeys] of updates) {
					const existing = getOrInit(data, docId, () => new Set<string>());
					for (const key of refKeys) existing.add(key);
				}
				this._markDirty(this._refPath(si));
			}
		}

		// ⑤ store shards — coalesced by shard index.
		if (state.store?.size) {
			const byShard = new Map<number, Map<string, unknown>>();
			for (const [rawId, doc] of state.store) {
				if (!doc) continue;
				const docId = String(rawId);
				if (this.type === '' && typeof rawId === 'number') this.type = 'number';
				getOrInit(
					byShard,
					shardIndex(docId, this._shards.store),
					() => new Map(),
				).set(docId, doc);
			}
			const shards = await this._loadShards(byShard.keys(), (si) =>
				this._storeShard(si),
			);
			for (const [si, docs] of byShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const [docId, doc] of docs) data.set(docId, doc);
				this._markDirty(this._storePath(si));
			}
		}

		// ⑥ registry shards — coalesced by shard index.
		if (!state.bypass && state.reg?.size) {
			const byShard = new Map<number, string[]>();
			for (const rawId of this._iterRegistry(state.reg)) {
				getOrInit(byShard, shardIndex(rawId, this._shards.reg), () => []).push(
					rawId,
				);
			}
			const shards = await this._loadShards(byShard.keys(), (si) =>
				this._regShard(si),
			);
			for (const [si, ids] of byShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const id of ids) data.add(id);
				this._markDirty(this._regPath(si));
			}
		}

		// ⑦ tags — live entirely in RAM, no shard I/O needed.
		if (state.tag?.size) {
			for (const [tag, ids] of state.tag) {
				const existing = new Set(this._tags.get(tag));
				for (const id of ids) existing.add(String(id));
				this._tags.set(tag, [...existing]);
			}
			this._tagsDirty = true;
		}

		// ⑧ Clear FlexSearch's in-memory accumulators (offload complete).
		state.map?.clear();
		state.ctx?.clear();
		state.tag?.clear();
		state.store?.clear();
		if (!state.document) state.reg?.clear();

		// ⑨ Flush all dirty shards to storage.
		await this._flush();
	}

	// ── get() ─────────────────────────────────────────────────────────────────

	async get(
		key: string,
		ctx: string | null | undefined,
		limit = 0,
		offset = 0,
		resolve = true,
		enrich = false,
		tags?: unknown[],
	): Promise<unknown[]> {
		if (tags) {
			return this.search(
				{ depth: !!ctx, bidirectional: this._bidirectional },
				ctx ? [ctx, key] : [key],
				limit,
				offset,
				/* suggest */ false,
				resolve,
				enrich,
				tags,
			);
		}

		const buckets = ctx
			? (await this._ctxShard(shardIndex(ctx, this._shards.ctx))).get(ctx)?.get(key)
			: (await this._mapShard(shardIndex(key, this._shards.map))).get(key);

		if (!buckets?.length) return [];

		const resolution = ctx ? this.resolution_ctx : this.resolution;
		const result = this._materialize(buckets, limit, offset, resolve, resolution);
		return enrich ? this._enrichItems(result, resolve) : result;
	}

	// ── search() ──────────────────────────────────────────────────────────────

	async search(
		options: SearchOptions,
		query: string[],
		limit = 100,
		offset = 0,
		suggest = false,
		resolve = true,
		enrich = false,
		tags?: unknown[],
	): Promise<unknown[]> {
		const useCtx = query.length > 1 && !!options.depth;
		const bidir = options.bidirectional ?? this._bidirectional;
		const resolution = useCtx ? this.resolution_ctx : this.resolution;

		// Phase 1: Preload all required shards in parallel. ───────────────────
		// Wall-clock cost = slowest single shard, not the sum of all shards.
		const mapShardIndices = new Set<number>();
		const ctxShardIndices = new Set<number>();

		if (useCtx) {
			let pivot = query[0];
			for (let i = 1; i < query.length; i++) {
				const term = query[i];
				ctxShardIndices.add(
					shardIndex(bidir && term > pivot ? term : pivot, this._shards.ctx),
				);
				pivot = term;
			}
		} else {
			for (const term of query)
				mapShardIndices.add(shardIndex(term, this._shards.map));
		}

		const [mapShards, ctxShards] = await Promise.all([
			this._loadShards(mapShardIndices, (si) => this._mapShard(si)),
			this._loadShards(ctxShardIndices, (si) => this._ctxShard(si)),
		]);

		// Phase 2: Build per-term score maps from the preloaded shards. ───────
		const scoreMaps: Map<string, number>[] = [];

		if (useCtx) {
			let pivot = query[0];
			for (let i = 1; i < query.length; i++) {
				const term = query[i];
				const swap = bidir && term > pivot;
				const ctKey = swap ? term : pivot;
				const termKey = swap ? pivot : term;
				const buckets = ctxShards
					.get(shardIndex(ctKey, this._shards.ctx))
					?.get(ctKey)
					?.get(termKey);
				if (buckets?.length)
					scoreMaps.push(this._toScoreMap(buckets, resolution));
				pivot = term;
			}
		} else {
			for (const term of query) {
				const buckets = mapShards
					.get(shardIndex(term, this._shards.map))
					?.get(term);
				if (buckets?.length)
					scoreMaps.push(this._toScoreMap(buckets, resolution));
			}
		}

		if (!scoreMaps.length) return [];

		// Phase 3: Merge score maps. ───────────────────────────────────────────
		const merged = suggest
			? this._mergeUnion(scoreMaps)
			: this._mergeIntersect(scoreMaps);

		// Phase 4: Tag filter. ─────────────────────────────────────────────────
		if (tags?.length) {
			for (const tagSet of this._resolveTagSets(tags)) {
				for (const id of merged.keys()) {
					if (!tagSet.has(id)) merged.delete(id);
				}
			}
		}

		if (!merged.size) return [];

		// Phase 5: Sort, paginate, format. ────────────────────────────────────
		let entries = [...merged.entries()].sort(([, a], [, b]) => b - a);
		if (offset) entries = entries.slice(offset);
		if (limit) entries = entries.slice(0, limit);

		let result: unknown[];
		if (resolve) {
			result = entries.map(([id]) => this._typedId(id));
		} else {
			// Build a sparse bucket array: index = (resolution - score).
			const bucketArr: ((string | number)[] | undefined)[] = [];
			for (const [id, score] of entries) {
				const bi = Math.max(resolution - score, 0);
				const bucket = bucketArr[bi];
				if (!bucket) {
					bucketArr[bi] = [this._typedId(id)];
				} else {
					bucket.push(this._typedId(id));
				}
			}
			result = bucketArr;
		}

		return enrich ? this._enrichItems(result, resolve) : result;
	}

	// ── tag() ─────────────────────────────────────────────────────────────────

	tag(tag: string, limit = 0, offset = 0, enrich = false): Promise<unknown[]> {
		const ids = this._tags.get(tag) ?? [];
		const page = ids
			.slice(offset, limit ? offset + limit : undefined)
			.map((id) => this._typedId(id));
		if (enrich) return this._enrichItems(page, /* resolve */ true);
		return Promise.resolve(page);
	}

	// ── enrich() ──────────────────────────────────────────────────────────────

	async enrich(
		ids: string | string[],
	): Promise<{ id: string | number; doc: unknown }[]> {
		const idList = Array.isArray(ids) ? ids : [ids];
		const shards = await this._loadShards(
			new Set(idList.map((id) => shardIndex(id, this._shards.store))),
			(si) => this._storeShard(si),
		);
		return idList.map((id) => ({
			id: this._typedId(id),
			doc: shards.get(shardIndex(id, this._shards.store))?.get(id) ?? null,
		}));
	}

	// ── has() ─────────────────────────────────────────────────────────────────

	async has(id: string | number): Promise<boolean> {
		const docId = String(id);
		return (await this._regShard(shardIndex(docId, this._shards.reg))).has(docId);
	}

	// ── remove() ──────────────────────────────────────────────────────────────

	async remove(ids: string | number | (string | number)[]): Promise<void> {
		const list = (Array.isArray(ids) ? ids : [ids]).map(String).filter(Boolean);
		if (!list.length) return;
		await this._removeBatch(list);
		await this._flush();
	}

	// ── transaction() — passthrough stub ─────────────────────────────────────

	async transaction(
		task: (ctx: this) => Promise<void>,
		cb?: () => void,
	): Promise<void> {
		await task(this);
		cb?.();
	}

	// ── info() ────────────────────────────────────────────────────────────────

	info(): Record<string, number> {
		return {
			cacheEntries: this._cache.size,
			cacheLimit: this._maxCache,
			tags: this._tags.size,
		};
	}

	// ── private — data helpers ────────────────────────────────────────────────

	/**
	 * Merge incoming score-buckets for `term` into `data`.
	 * Deduplicates IDs within each bucket and accumulates reverse-reference keys
	 * into `pendingRefs` for a later batch write to the ref shard index.
	 */
	private _mergeScoreBuckets(
		data: MapShardData,
		term: string,
		incoming: ScoreBuckets,
		refKey: string,
		pendingRefs: Map<string, Set<string>>,
	): void {
		const existing = getOrInit(data, term, () => []);

		for (let i = 0; i < incoming.length; i++) {
			const src = incoming[i];
			if (!src?.length) continue;
			if (this.type === '' && !isNaN(Number(src[0]))) this.type = 'number';

			const dst = (existing[i] ??= []);
			const seen = new Set(dst);

			for (const rawId of src) {
				const id = String(rawId);
				if (!seen.has(id)) {
					seen.add(id);
					dst.push(id);
				}
				getOrInit(pendingRefs, id, () => new Set()).add(refKey);
			}
		}
	}

	/**
	 * Two-phase batch removal.
	 *
	 * Phase A: Load all ref shards in parallel to discover which map/ctx/store/reg
	 *          shards are affected — then load those in parallel.
	 * Phase B: Apply all deletions in-memory with no further I/O.
	 */
	private async _removeBatch(ids: string[]): Promise<void> {
		// Phase A-1: Load ref shards. ─────────────────────────────────────────
		const refShardIndices = new Set(
			ids.map((id) => shardIndex(id, this._shards.ref)),
		);
		const refShards = await this._loadShards(refShardIndices, (si) =>
			this._refShard(si),
		);

		// Group mutations by target shard index.
		const mapRemovals = new Map<number, { term: string; id: string }[]>();
		const ctxRemovals = new Map<
			number,
			{ ctTerm: string; term: string; id: string }[]
		>();
		const storeRemovals = new Map<number, string[]>();
		const regRemovals = new Map<number, string[]>();

		for (const id of ids) {
			const refSI = shardIndex(id, this._shards.ref);
			const refData = refShards.get(refSI);
			const refs = refData?.get(id);

			if (refs && refData) {
				for (const ref of refs) {
					const pipePos = ref.indexOf('|');
					const kind = ref.slice(0, pipePos);
					const rest = ref.slice(pipePos + 1);

					if (kind === 'map') {
						const si = shardIndex(rest, this._shards.map);
						getOrInit(mapRemovals, si, () => []).push({ term: rest, id });
					} else {
						// kind === 'ctx'; rest is `ctTerm|term`
						const pipe2 = rest.indexOf('|');
						const ctTerm = rest.slice(0, pipe2);
						const term = rest.slice(pipe2 + 1);
						const si = shardIndex(ctTerm, this._shards.ctx);
						getOrInit(ctxRemovals, si, () => []).push({ ctTerm, term, id });
					}
				}
				refData.delete(id);
				this._markDirty(this._refPath(refSI));
			}

			const storeSI = shardIndex(id, this._shards.store);
			getOrInit(storeRemovals, storeSI, () => []).push(id);

			const regSI = shardIndex(id, this._shards.reg);
			getOrInit(regRemovals, regSI, () => []).push(id);
		}

		// Phase A-2: Load all affected shards in parallel. ────────────────────
		const [mapShards, ctxShards, storeShards, regShards] = await Promise.all([
			this._loadShards(mapRemovals.keys(), (si) => this._mapShard(si)),
			this._loadShards(ctxRemovals.keys(), (si) => this._ctxShard(si)),
			this._loadShards(storeRemovals.keys(), (si) => this._storeShard(si)),
			this._loadShards(regRemovals.keys(), (si) => this._regShard(si)),
		]);

		// Phase B: Apply all mutations in-memory (no I/O). ────────────────────
		for (const [si, removals] of mapRemovals) {
			const data = mapShards.get(si);
			if (!data) continue;
			for (const { term, id } of removals)
				this._removeIdFromBuckets(data.get(term), id);
			this._markDirty(this._mapPath(si));
		}

		for (const [si, removals] of ctxRemovals) {
			const data = ctxShards.get(si);
			if (!data) continue;
			for (const { ctTerm, term, id } of removals) {
				this._removeIdFromBuckets(data.get(ctTerm)?.get(term), id);
			}
			this._markDirty(this._ctxPath(si));
		}

		for (const [si, docIds] of storeRemovals) {
			const data = storeShards.get(si);
			if (!data) continue;
			for (const id of docIds) data.delete(id);
			this._markDirty(this._storePath(si));
		}

		for (const [si, docIds] of regRemovals) {
			const data = regShards.get(si);
			if (!data) continue;
			for (const id of docIds) data.delete(id);
			this._markDirty(this._regPath(si));
		}

		// Tags live in RAM — no shard loading needed.
		const idSet = new Set(ids);
		for (const tagIds of this._tags.values()) {
			for (let i = tagIds.length - 1; i >= 0; i--) {
				if (idSet.has(tagIds[i])) {
					tagIds.splice(i, 1);
					this._tagsDirty = true;
				}
			}
		}
	}

	/** Remove the first occurrence of `id` from every bucket in `buckets`. */
	private _removeIdFromBuckets(buckets: ScoreBuckets | undefined, id: string): void {
		if (!buckets) return;
		for (const bucket of buckets) {
			if (!bucket) continue;
			const pos = bucket.indexOf(id);
			if (pos !== -1) bucket.splice(pos, 1);
		}
	}

	// ── private — search helpers ──────────────────────────────────────────────

	/** Build a `Map<docId, bestScore>` from a score-bucket array. */
	private _toScoreMap(buckets: ScoreBuckets, resolution: number): Map<string, number> {
		const out = new Map<string, number>();
		for (let i = 0; i < buckets.length; i++) {
			const bucket = buckets[i];
			if (!bucket?.length) continue;
			const score = resolution - i;
			for (const id of bucket) {
				if ((out.get(id) ?? -1) < score) out.set(id, score);
			}
		}
		return out;
	}

	/**
	 * Intersection with MAX aggregate — mirrors `ZINTERSTORE AGGREGATE MAX`.
	 * Only IDs present in *all* score maps are kept.
	 */
	private _mergeIntersect(maps: Map<string, number>[]): Map<string, number> {
		if (maps.length === 1) return maps[0];
		// Iterate over the smallest map to minimise comparisons.
		maps.sort((a, b) => a.size - b.size);
		const out = new Map<string, number>();
		outer: for (const [id, score0] of maps[0]) {
			let maxScore = score0;
			for (let k = 1; k < maps.length; k++) {
				const s = maps[k].get(id);
				if (s === undefined) continue outer;
				if (s > maxScore) maxScore = s;
			}
			out.set(id, maxScore);
		}
		return out;
	}

	/**
	 * Suggest merge — replicates the two-step ZINTERSTORE + ZUNIONSTORE trick.
	 * All IDs are included (union), but IDs present in *all* term maps are
	 * boosted by `n × their intersection sum` so they rank above partial matches.
	 */
	private _mergeUnion(maps: Map<string, number>[]): Map<string, number> {
		const n = maps.length;
		const union = new Map<string, number>();
		for (const m of maps) {
			for (const [id, score] of m) union.set(id, (union.get(id) ?? 0) + score);
		}
		// Boost IDs present in every map.
		maps.sort((a, b) => a.size - b.size);
		outer: for (const [id, score0] of maps[0]) {
			let sum = score0;
			for (let k = 1; k < maps.length; k++) {
				const s = maps[k].get(id);
				if (s === undefined) continue outer;
				sum += s;
			}
			union.set(id, (union.get(id) ?? 0) + sum * n);
		}
		return union;
	}

	// ── private — output helpers ──────────────────────────────────────────────

	/**
	 * Flatten score-buckets into a paged result.
	 * When `resolve` is `true` returns a flat array of typed IDs.
	 * When `resolve` is `false` returns a sparse bucket array (index = score rank).
	 */
	private _materialize(
		buckets: ScoreBuckets,
		limit: number,
		offset: number,
		resolve: boolean,
		resolution: number,
	): unknown[] {
		const flat: { id: string; score: number }[] = [];
		for (let i = 0; i < buckets.length; i++) {
			const bucket = buckets[i];
			if (!bucket?.length) continue;
			const score = resolution - i;
			for (const id of bucket) flat.push({ id, score });
		}

		const page = flat.slice(offset, limit ? offset + limit : undefined);

		if (resolve) return page.map(({ id }) => this._typedId(id));

		const out: ((string | number)[] | undefined)[] = [];
		for (const { id, score } of page) {
			const bi = Math.max(resolution - score, 0);
			const bucket = out[bi];
			if (!bucket) {
				out[bi] = [this._typedId(id)];
			} else {
				bucket.push(this._typedId(id));
			}
		}
		return out;
	}

	/**
	 * Enrich a result set with stored documents.
	 * Preloads all required store shards in one parallel sweep.
	 */
	private async _enrichItems(result: unknown[], resolve: boolean): Promise<unknown[]> {
		if (resolve) {
			// `result` is a flat array of typed IDs; delegate to `enrich()`.
			return this.enrich(result as string[]);
		}

		// `result` is a sparse bucket array; collect all IDs across every bucket.
		const allIds: string[] = [];
		for (const bucket of result) {
			if (Array.isArray(bucket)) {
				for (const id of bucket) allIds.push(String(id));
			}
		}

		const shards = await this._loadShards(
			new Set(allIds.map((id) => shardIndex(id, this._shards.store))),
			(si) => this._storeShard(si),
		);

		return result.map((bucket) => {
			if (!Array.isArray(bucket)) return undefined;
			return bucket.map((rawId) => {
				const id = String(rawId);
				return {
					id: this._typedId(id),
					doc: shards.get(shardIndex(id, this._shards.store))?.get(id) ?? null,
				};
			});
		});
	}

	/**
	 * Resolve tag filter pairs `[name, value, name, value, …]` into Sets of
	 * matching document IDs.  Each pair must match for a document to pass.
	 */
	private _resolveTagSets(tags: unknown[]): Set<string>[] {
		const sets: Set<string>[] = [];
		for (let i = 0; i + 1 < tags.length; i += 2) {
			const name = String(tags[i]);
			const value = String(tags[i + 1]);
			const ids =
				this._tags.get(`${name}:${value}`) ??
				this._tags.get(value) ??
				this._tags.get(`${sanitizeName(name)}:${value}`);
			if (ids) sets.push(new Set(ids));
		}
		return sets;
	}

	/** Normalise a FlexSearch registry (Set or Map) to an array of string IDs. */
	private _iterRegistry(
		reg: Set<string | number> | Map<string | number, unknown>,
	): string[] {
		if (reg instanceof Set) return [...reg].map(String);
		if (reg instanceof Map) return [...reg.keys()].map(String);
		return [];
	}

	/** Return the ID in its natural type: `number` when the index uses numeric IDs. */
	private _typedId(id: string): string | number {
		return this.type === 'number' ? parseInt(id, 10) : id;
	}
}
