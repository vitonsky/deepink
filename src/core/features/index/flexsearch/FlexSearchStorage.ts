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
 * Write-back policy: mutations are applied to the cached shard in memory
 * and flushed to the file store only on commit(), close(), or shard eviction.
 *
 * Multi-shard operations (search, commit, remove) preload all required shards
 * in parallel before touching any of them, so wall-clock I/O cost equals the
 * slowest single shard, not the sum of all shards.
 */

import { IFilesStorage } from '@core/features/files';

// ─── tuning ───────────────────────────────────────────────────────────────────

export interface ShardConfig {
	/** Inverted-index shards.  Target: ≤ 1 MB per shard file.           */
	map: number; // default 256
	/** Context-pair index shards.                                        */
	ctx: number; // default 256
	/** Document-store shards (larger payload per entry).                 */
	store: number; // default 1024
	/** Reverse-reference index shards.                                   */
	ref: number; // default 256
	/** Registry (all known doc-ids) shards.                              */
	reg: number; // default 64
}

const DEFAULT_SHARDS: ShardConfig = {
	map: 256,
	ctx: 256,
	store: 1024,
	ref: 256,
	reg: 64,
};

// ─── binary codec ─────────────────────────────────────────────────────────────

const _ENC = new TextEncoder();
const _DEC = new TextDecoder();

/** Shard-format version byte written at the start of every binary shard. */
const VER = 1;
const ID_STR = 0; // IDs encoded as uint16-length-prefixed UTF-8
const ID_U32 = 1; // IDs encoded as uint32 little-endian (numeric ids ≤ 2³²-1)

class BinaryWriter {
	private _buf: Uint8Array;
	private _dv: DataView;
	private _pos = 0;

	constructor(hint = 65536) {
		this._buf = new Uint8Array(hint);
		this._dv = new DataView(this._buf.buffer);
	}

	private _grow(n: number): void {
		if (this._pos + n <= this._buf.length) return;
		const next = new Uint8Array(Math.max(this._buf.length * 2, this._pos + n));
		next.set(this._buf);
		this._buf = next;
		this._dv = new DataView(this._buf.buffer);
	}

	u8(v: number): this {
		this._grow(1);
		this._buf[this._pos++] = v & 0xff;
		return this;
	}
	u16(v: number): this {
		this._grow(2);
		this._dv.setUint16(this._pos, v, true);
		this._pos += 2;
		return this;
	}
	u32(v: number): this {
		this._grow(4);
		this._dv.setUint32(this._pos, v >>> 0, true);
		this._pos += 4;
		return this;
	}

	raw(b: Uint8Array): this {
		this._grow(b.length);
		this._buf.set(b, this._pos);
		this._pos += b.length;
		return this;
	}

	/** Write a uint16-length-prefixed UTF-8 string (max 65535 bytes). */
	str(s: string): this {
		const b = _ENC.encode(s);
		return this.u16(b.length).raw(b);
	}

	done(): ArrayBuffer {
		// slice() produces a copy of exactly the written bytes.
		return this._buf.buffer.slice(0, this._pos) as ArrayBuffer;
	}
}

class BinaryReader {
	private readonly _buf: Uint8Array;
	private readonly _dv: DataView;
	private _pos = 0;

	constructor(buf: ArrayBuffer) {
		this._buf = new Uint8Array(buf);
		this._dv = new DataView(buf);
	}

	u8(): number {
		return this._buf[this._pos++];
	}
	u16(): number {
		const v = this._dv.getUint16(this._pos, true);
		this._pos += 2;
		return v;
	}
	u32(): number {
		const v = this._dv.getUint32(this._pos, true);
		this._pos += 4;
		return v;
	}

	str(): string {
		const len = this.u16();
		const s = _DEC.decode(this._buf.subarray(this._pos, this._pos + len));
		this._pos += len;
		return s;
	}

	/** Read an id: uint32 if numeric flag is set, otherwise str(). */
	id(numeric: boolean): string {
		return numeric ? String(this.u32()) : this.str();
	}
}

// ─── shard format helpers ────────────────────────────────────────────────────

type Bkts = string[][]; // score-bucket array; index 0 = highest relevance

function writeBkts(w: BinaryWriter, bkts: Bkts, numeric: boolean): void {
	// Collect only non-empty buckets to keep the binary representation sparse.
	const ne: [number, string[]][] = [];
	for (let i = 0; i < bkts.length; i++) {
		if (bkts[i]?.length) ne.push([i, bkts[i]]);
	}
	w.u8(ne.length);
	for (const [bi, ids] of ne) {
		w.u8(bi).u32(ids.length);
		for (const id of ids) {
			if (numeric) w.u32(parseInt(id, 10));
			else w.str(id);
		}
	}
}

function readBkts(r: BinaryReader, numeric: boolean): Bkts {
	const count = r.u8();
	const bkts: Bkts = [];
	for (let b = 0; b < count; b++) {
		const bi = r.u8();
		const n = r.u32();
		const ids = new Array<string>(n);
		for (let i = 0; i < n; i++) ids[i] = r.id(numeric);
		bkts[bi] = ids;
	}
	return bkts;
}

// ── map shard ─────────────────────────────────────────────────────────────────

function encodeMapShard(data: Map<string, Bkts>, numeric: boolean): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(VER)
		.u8(numeric ? ID_U32 : ID_STR)
		.u32(data.size);
	for (const [term, bkts] of data) {
		w.str(term);
		writeBkts(w, bkts, numeric);
	}
	return w.done();
}

function decodeMapShard(buf: ArrayBuffer): Map<string, Bkts> {
	const r = new BinaryReader(buf);
	r.u8(); // version
	const numeric = r.u8() === ID_U32;
	const n = r.u32();
	const out = new Map<string, Bkts>();
	for (let i = 0; i < n; i++) out.set(r.str(), readBkts(r, numeric));
	return out;
}

// ── ctx shard ─────────────────────────────────────────────────────────────────

function encodeCtxShard(
	data: Map<string, Map<string, Bkts>>,
	numeric: boolean,
): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(VER)
		.u8(numeric ? ID_U32 : ID_STR)
		.u32(data.size);
	for (const [ct, inner] of data) {
		w.str(ct).u32(inner.size);
		for (const [term, bkts] of inner) {
			w.str(term);
			writeBkts(w, bkts, numeric);
		}
	}
	return w.done();
}

function decodeCtxShard(buf: ArrayBuffer): Map<string, Map<string, Bkts>> {
	const r = new BinaryReader(buf);
	r.u8();
	const numeric = r.u8() === ID_U32;
	const n = r.u32();
	const out = new Map<string, Map<string, Bkts>>();
	for (let i = 0; i < n; i++) {
		const ct = r.str();
		const icount = r.u32();
		const inner = new Map<string, Bkts>();
		for (let j = 0; j < icount; j++) inner.set(r.str(), readBkts(r, numeric));
		out.set(ct, inner);
	}
	return out;
}

// ── ref shard ─────────────────────────────────────────────────────────────────

function encodeRefShard(data: Map<string, Set<string>>, numeric: boolean): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(VER)
		.u8(numeric ? ID_U32 : ID_STR)
		.u32(data.size);
	for (const [id, refs] of data) {
		if (numeric) w.u32(parseInt(id, 10));
		else w.str(id);
		w.u16(refs.size);
		for (const ref of refs) w.str(ref);
	}
	return w.done();
}

function decodeRefShard(buf: ArrayBuffer): Map<string, Set<string>> {
	const r = new BinaryReader(buf);
	r.u8();
	const numeric = r.u8() === ID_U32;
	const n = r.u32();
	const out = new Map<string, Set<string>>();
	for (let i = 0; i < n; i++) {
		const id = r.id(numeric);
		const nc = r.u16();
		const refs = new Set<string>();
		for (let j = 0; j < nc; j++) refs.add(r.str());
		out.set(id, refs);
	}
	return out;
}

// ── reg shard ─────────────────────────────────────────────────────────────────

function encodeRegShard(data: Set<string>, numeric: boolean): ArrayBuffer {
	const w = new BinaryWriter();
	w.u8(VER)
		.u8(numeric ? ID_U32 : ID_STR)
		.u32(data.size);
	for (const id of data) {
		if (numeric) w.u32(parseInt(id, 10));
		else w.str(id);
	}
	return w.done();
}

function decodeRegShard(buf: ArrayBuffer): Set<string> {
	const r = new BinaryReader(buf);
	r.u8();
	const numeric = r.u8() === ID_U32;
	const n = r.u32();
	const out = new Set<string>();
	for (let i = 0; i < n; i++) out.add(r.id(numeric));
	return out;
}

// ── json helpers (store, tag) ─────────────────────────────────────────────────

function encodeJSON(v: unknown): ArrayBuffer {
	return _ENC.encode(JSON.stringify(v)).buffer;
}

function decodeJSON<T>(buf: ArrayBuffer): T {
	return JSON.parse(_DEC.decode(buf)) as T;
}

// ─── shard hash ───────────────────────────────────────────────────────────────

function shardOf(key: string, count: number): number {
	let h = 5381;
	for (let i = 0; i < key.length; i++) {
		h = (Math.imul(h, 33) ^ key.charCodeAt(i)) | 0;
	}
	return (h >>> 0) % count;
}

// ─── internal types ───────────────────────────────────────────────────────────

type MapShardData = Map<string, Bkts>;
type CtxShardData = Map<string, MapShardData>;
type StoreShardData = Map<string, unknown>;
type RefShardData = Map<string, Set<string>>;
type RegShardData = Set<string>;
type ShardData =
	| MapShardData
	| CtxShardData
	| StoreShardData
	| RefShardData
	| RegShardData;
type ShardCat = 'map' | 'ctx' | 'store' | 'ref' | 'reg';

interface CacheEntry {
	data: ShardData;
	dirty: boolean;
	cat: ShardCat;
}

function sanitize(s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

// ─── main class ───────────────────────────────────────────────────────────────

export class FlexSearchStorage {
	// ── FlexSearch interface properties ──────────────────────────────────────

	public db: any;
	public support_tag_search = true;
	public fastupdate = true;
	public resolution = 9;
	public resolution_ctx = 9;
	/** '' | 'number' — detected from the first doc-id seen; do not set manually. */
	public type = '';

	// ── Internal ──────────────────────────────────────────────────────────────

	private readonly _fs: IFilesStorage;
	private readonly _name: string;
	private readonly _field: string;
	private readonly _shards: ShardConfig;
	private readonly _maxCache: number;

	/**
	 * LRU cache, keyed by shard path.
	 * Map preserves insertion order: the Map start is the LRU end, the Map end
	 * is the MRU end.  _touch() moves an entry to the MRU end.
	 */
	private readonly _cache = new Map<string, CacheEntry>();

	/**
	 * Deduplicates concurrent loads of the same shard path.
	 * If two async operations both miss on path P, only one file read is issued.
	 */
	private readonly _loading = new Map<string, Promise<ShardData>>();

	/** Tags kept fully in RAM (single small file, accessed on every Document query). */
	private readonly _tag = new Map<string, string[]>();
	private _tagDirty = false;

	private _isOpen = false;
	private _bidir = false;
	private _evicting = false;

	// ── Constructor ───────────────────────────────────────────────────────────

	constructor(
		fs: IFilesStorage,
		name: string | { name?: string; field?: string } = 'flexsearch',
		config: {
			field?: string;
			shards?: Partial<ShardConfig>;
			cacheSize?: number;
		} = {},
	) {
		this._fs = fs;
		this.db = fs;

		if (typeof name === 'string') {
			this._name = sanitize(name) || 'flexsearch';
			this._field = config.field ? `-${sanitize(config.field)}` : '';
		} else {
			this._name = sanitize(name.name ?? 'flexsearch') || 'flexsearch';
			this._field = name.field ? `-${sanitize(name.field)}` : '';
		}

		this._shards = { ...DEFAULT_SHARDS, ...config.shards };
		this._maxCache = config.cacheSize ?? 128;
	}

	// ── Path helpers ──────────────────────────────────────────────────────────

	private _pm(i: number): string {
		return `/${this._name}/map${this._field}/${i}`;
	}
	private _pc(i: number): string {
		return `/${this._name}/ctx${this._field}/${i}`;
	}
	private _ps(i: number): string {
		return `/${this._name}/store/${i}`;
	}
	private _pr(i: number): string {
		return `/${this._name}/ref${this._field}/${i}`;
	}
	private _pReg(i: number): string {
		return `/${this._name}/reg/${i}`;
	}
	private _pTag(): string {
		return `/${this._name}/tag${this._field}`;
	}

	// ── Cache primitives ──────────────────────────────────────────────────────

	/**
	 * Move an existing cache entry to the MRU position.
	 * Returns the entry's data, or undefined on a cache miss.
	 */
	private _touch(path: string): ShardData | undefined {
		const entry = this._cache.get(path);
		if (!entry) return undefined;
		this._cache.delete(path);
		this._cache.set(path, entry);
		return entry.data;
	}

	private _markDirty(path: string): void {
		const e = this._cache.get(path);
		if (e) e.dirty = true;
	}

	/**
	 * Load a shard from the file store and insert it into the cache.
	 * Concurrent calls for the same path are coalesced into a single file read.
	 */
	private _loadIntoCache(path: string, cat: ShardCat): Promise<ShardData> {
		const inflight = this._loading.get(path);
		if (inflight) return inflight;

		const promise = (async (): Promise<ShardData> => {
			if (this._cache.size >= this._maxCache) {
				await this._evictOne(path);
			}
			const buf = await this._fs.get(path);
			const data = buf ? this._decode(cat, buf) : this._empty(cat);
			this._cache.set(path, { data, dirty: false, cat });
			this._scheduleEagerEviction();
			return data;
		})();

		this._loading.set(path, promise);
		promise.finally(() => this._loading.delete(path));
		return promise;
	}

	/** Retrieve a shard, loading it if necessary. */
	private _getShard(path: string, cat: ShardCat): Promise<ShardData> {
		const cached = this._touch(path);
		return cached !== undefined
			? Promise.resolve(cached)
			: this._loadIntoCache(path, cat);
	}

	/**
	 * Retrieve a shard only if it is already in the cache (no I/O).
	 * Call only after a prior _getShard / preload Promise.all has completed.
	 */
	private _getSync(path: string): ShardData | undefined {
		return this._touch(path);
	}

	// ── Typed shard accessors ─────────────────────────────────────────────────

	private _mapShard(i: number): Promise<MapShardData> {
		return this._getShard(this._pm(i), 'map') as Promise<MapShardData>;
	}
	private _ctxShard(i: number): Promise<CtxShardData> {
		return this._getShard(this._pc(i), 'ctx') as Promise<CtxShardData>;
	}
	private _storeShard(i: number): Promise<StoreShardData> {
		return this._getShard(this._ps(i), 'store') as Promise<StoreShardData>;
	}
	private _refShard(i: number): Promise<RefShardData> {
		return this._getShard(this._pr(i), 'ref') as Promise<RefShardData>;
	}
	private _regShard(i: number): Promise<RegShardData> {
		return this._getShard(this._pReg(i), 'reg') as Promise<RegShardData>;
	}

	private _mapSync(i: number): MapShardData | undefined {
		return this._getSync(this._pm(i)) as MapShardData | undefined;
	}
	private _ctxSync(i: number): CtxShardData | undefined {
		return this._getSync(this._pc(i)) as CtxShardData | undefined;
	}
	private _storeSync(i: number): StoreShardData | undefined {
		return this._getSync(this._ps(i)) as StoreShardData | undefined;
	}
	private _refSync(i: number): RefShardData | undefined {
		return this._getSync(this._pr(i)) as RefShardData | undefined;
	}
	private _regSync(i: number): RegShardData | undefined {
		return this._getSync(this._pReg(i)) as RegShardData | undefined;
	}

	// ── Eviction ──────────────────────────────────────────────────────────────

	/**
	 * Evict one shard, preferring the LRU clean entry to avoid a write.
	 * Falls back to the LRU dirty entry when all cached shards are dirty.
	 * Never evicts `skipPath` (the path we are about to load).
	 */
	private async _evictOne(skipPath?: string): Promise<void> {
		let targetPath: string | undefined;
		let targetEntry: CacheEntry | undefined;

		for (const [path, entry] of this._cache) {
			if (path === skipPath) continue;
			if (!entry.dirty) {
				targetPath = path;
				targetEntry = entry;
				break;
			}
			if (!targetPath) {
				targetPath = path;
				targetEntry = entry;
			}
		}

		if (!targetPath || !targetEntry) return;

		this._cache.delete(targetPath);
		if (targetEntry.dirty) await this._writeToDisk(targetPath, targetEntry);
	}

	/**
	 * Proactively evict clean entries when the cache exceeds 80 % of its limit,
	 * using a microtask so it does not block the current operation.
	 * Only clean entries are evicted here, avoiding async write latency on
	 * the hot path.
	 */
	private _scheduleEagerEviction(): void {
		if (this._evicting || this._cache.size <= Math.floor(this._maxCache * 0.8))
			return;
		this._evicting = true;
		Promise.resolve().then(() => {
			try {
				const target = Math.floor(this._maxCache * 0.7);
				for (const [path, entry] of this._cache) {
					if (this._cache.size <= target) break;
					if (!entry.dirty) this._cache.delete(path);
				}
			} finally {
				this._evicting = false;
			}
		});
	}

	// ── Persistence ───────────────────────────────────────────────────────────

	/** Flush all dirty cached shards and the tag file to the file store. */
	private async _flush(): Promise<void> {
		const writes: Promise<void>[] = [];

		for (const [path, entry] of this._cache) {
			if (!entry.dirty) continue;
			entry.dirty = false;
			writes.push(this._writeToDisk(path, entry));
		}

		if (this._tagDirty) {
			writes.push(
				this._tag.size
					? this._fs.write(
							this._pTag(),
							encodeJSON(Object.fromEntries(this._tag)),
						)
					: this._fs.delete([this._pTag()]),
			);
			this._tagDirty = false;
		}

		await Promise.all(writes);
	}

	private async _writeToDisk(path: string, entry: CacheEntry): Promise<void> {
		if (this._dataIsEmpty(entry)) {
			await this._fs.delete([path]).catch(() => {
				/* already absent */
			});
		} else {
			await this._fs.write(path, this._encode(entry.cat, entry.data));
		}
	}

	// ── Codec dispatch ────────────────────────────────────────────────────────

	private _encode(cat: ShardCat, data: ShardData): ArrayBuffer {
		const num = this.type === 'number';
		switch (cat) {
			case 'map':
				return encodeMapShard(data as MapShardData, num);
			case 'ctx':
				return encodeCtxShard(data as CtxShardData, num);
			case 'store':
				return encodeJSON(Object.fromEntries(data as StoreShardData));
			case 'ref':
				return encodeRefShard(data as RefShardData, num);
			case 'reg':
				return encodeRegShard(data as RegShardData, num);
		}
	}

	private _decode(cat: ShardCat, buf: ArrayBuffer): ShardData {
		switch (cat) {
			case 'map':
				return decodeMapShard(buf);
			case 'ctx':
				return decodeCtxShard(buf);
			case 'store': {
				const obj = decodeJSON<Record<string, unknown>>(buf);
				return new Map(Object.entries(obj));
			}
			case 'ref':
				return decodeRefShard(buf);
			case 'reg':
				return decodeRegShard(buf);
		}
	}

	private _empty(cat: ShardCat): ShardData {
		switch (cat) {
			case 'map':
				return new Map<string, Bkts>();
			case 'ctx':
				return new Map<string, MapShardData>();
			case 'store':
				return new Map<string, unknown>();
			case 'ref':
				return new Map<string, Set<string>>();
			case 'reg':
				return new Set<string>();
		}
	}

	private _dataIsEmpty(entry: CacheEntry): boolean {
		return entry.cat === 'reg'
			? (entry.data as RegShardData).size === 0
			: (entry.data as Map<unknown, unknown>).size === 0;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	async mount(index: any): Promise<void> {
		if (index.index) return index.mount(this); // Document index
		index.db = this;
		this.resolution = index.resolution ?? this.resolution;
		this.resolution_ctx = index.resolution_ctx ?? this.resolution_ctx;
		this._bidir = index.bidirectional ?? false;
		return this.open();
	}

	async open(): Promise<void> {
		if (this._isOpen) return;
		this._isOpen = true;
		// Only the tag store is eagerly loaded; all other shards are demand-paged.
		const buf = await this._fs.get(this._pTag());
		if (buf) {
			const obj = decodeJSON<Record<string, string[]>>(buf);
			for (const [k, v] of Object.entries(obj)) this._tag.set(k, v);
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
		this._tag.clear();
		this._tagDirty = false;

		const prefix = `/${this._name}/`;
		const all = await this._fs.list();
		const ours = all.filter((p) => p.startsWith(prefix));
		if (ours.length) await this._fs.delete(ours);
	}

	// ── commit() ──────────────────────────────────────────────────────────────

	async commit(fs: any): Promise<void> {
		// ① Drain queued deletions first
		const tasks: any[] = fs.commit_task ?? [];
		fs.commit_task = [];
		const dels: string[] = [];
		for (const t of tasks) if (t.del != null) dels.push(String(t.del));
		if (dels.length) await this._removeBatch(dels);

		if (!fs.reg?.size && !dels.length) return;

		// pendingRefs collects (docId → new refKeys) across all map/ctx writes.
		// After map and ctx are processed, we flush pendingRefs to the ref index
		// in a second parallel I/O pass, so each ref shard is loaded at most once.
		const pendingRefs = new Map<string, Set<string>>();

		// ② map — write-coalesced by map shard
		if (fs.map?.size) {
			const byShard = this._groupBy(fs.map as Map<string, Bkts>, this._shards.map);
			await Promise.all([...byShard.keys()].map((si) => this._mapShard(si)));
			for (const [si, terms] of byShard) {
				const data = this._mapSync(si)!;
				for (const [term, bkts] of terms) {
					this._mergeBkts(data, term, bkts, `map|${term}`, pendingRefs);
				}
				this._markDirty(this._pm(si));
			}
		}

		// ③ ctx — write-coalesced by ctx shard
		if (fs.ctx?.size) {
			const byShard = this._groupBy(
				fs.ctx as Map<string, Map<string, Bkts>>,
				this._shards.ctx,
			);
			await Promise.all([...byShard.keys()].map((si) => this._ctxShard(si)));
			for (const [si, ctxTerms] of byShard) {
				const data = this._ctxSync(si)!;
				for (const [ct, innerMap] of ctxTerms) {
					let inner = data.get(ct);
					if (!inner) {
						inner = new Map();
						data.set(ct, inner);
					}
					for (const [term, bkts] of innerMap) {
						this._mergeBkts(
							inner,
							term,
							bkts,
							`ctx|${ct}|${term}`,
							pendingRefs,
						);
					}
				}
				this._markDirty(this._pc(si));
			}
		}

		// ④ Write pendingRefs into ref shards (one load per shard)
		if (pendingRefs.size) {
			const byRefShard = new Map<number, Map<string, Set<string>>>();
			for (const [id, keys] of pendingRefs) {
				const si = shardOf(id, this._shards.ref);
				let g = byRefShard.get(si);
				if (!g) {
					g = new Map();
					byRefShard.set(si, g);
				}
				g.set(id, keys);
			}
			await Promise.all([...byRefShard.keys()].map((si) => this._refShard(si)));
			for (const [si, updates] of byRefShard) {
				const data = this._refSync(si)!;
				for (const [id, keys] of updates) {
					let refs = data.get(id);
					if (!refs) {
						refs = new Set();
						data.set(id, refs);
					}
					for (const k of keys) refs.add(k);
				}
				this._markDirty(this._pr(si));
			}
		}

		// ⑤ store — coalesced by store shard
		if (fs.store?.size) {
			const byShard = new Map<number, Map<string, unknown>>();
			for (const [id, doc] of fs.store as Map<string | number, unknown>) {
				if (!doc) continue;
				const sid = String(id);
				if (this.type === '' && typeof id === 'number') this.type = 'number';
				const si = shardOf(sid, this._shards.store);
				let g = byShard.get(si);
				if (!g) {
					g = new Map();
					byShard.set(si, g);
				}
				g.set(sid, doc);
			}
			await Promise.all([...byShard.keys()].map((si) => this._storeShard(si)));
			for (const [si, docs] of byShard) {
				const data = this._storeSync(si)!;
				for (const [sid, doc] of docs) data.set(sid, doc);
				this._markDirty(this._ps(si));
			}
		}

		// ⑥ registry — coalesced by reg shard
		if (!fs.bypass && fs.reg?.size) {
			const ids = this._iterReg(fs.reg);
			const byRegShard = new Map<number, string[]>();
			for (const id of ids) {
				const si = shardOf(id, this._shards.reg);
				let g = byRegShard.get(si);
				if (!g) {
					g = [];
					byRegShard.set(si, g);
				}
				g.push(id);
			}
			await Promise.all([...byRegShard.keys()].map((si) => this._regShard(si)));
			for (const [si, regIds] of byRegShard) {
				const data = this._regSync(si)!;
				for (const id of regIds) data.add(id);
				this._markDirty(this._pReg(si));
			}
		}

		// ⑦ tags
		if (fs.tag?.size) {
			for (const [tag, ids] of fs.tag as Map<string, (string | number)[]>) {
				const cur = this._tag.get(tag) ?? [];
				const set = new Set(cur);
				for (const id of ids) set.add(String(id));
				this._tag.set(tag, [...set]);
			}
			this._tagDirty = true;
		}

		// ⑧ Clear FlexSearch's accumulators — this is the offload step
		fs.map?.clear();
		fs.ctx?.clear();
		fs.tag?.clear();
		fs.store?.clear();
		if (!fs.document) fs.reg?.clear();

		// ⑨ Flush all dirty shards in parallel
		await this._flush();
	}

	// ── get() ─────────────────────────────────────────────────────────────────

	async get(
		key: string,
		ctx?: string | null,
		limit = 0,
		offset = 0,
		resolve = true,
		enrich = false,
		tags?: any[],
	): Promise<any[]> {
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

		let bkts: Bkts | undefined;
		if (ctx) {
			bkts = (await this._ctxShard(shardOf(ctx, this._shards.ctx)))
				.get(ctx)
				?.get(key);
		} else {
			bkts = (await this._mapShard(shardOf(key, this._shards.map))).get(key);
		}

		if (!bkts?.length) return [];
		const res = ctx ? this.resolution_ctx : this.resolution;
		const result = this._materialise(bkts, limit, offset, resolve, res);
		return enrich ? this._enrichItems(result, resolve) : result;
	}

	// ── search() ──────────────────────────────────────────────────────────────

	async search(
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

		// Phase 1: preload all required shards in parallel ────────────────────
		const mapSI = new Set<number>();
		const ctxSI = new Set<number>();

		if (useCtx) {
			let kw = query[0];
			for (let i = 1; i < query.length; i++) {
				const term = query[i];
				const ct = bidir && term > kw ? term : kw;
				ctxSI.add(shardOf(ct, this._shards.ctx));
				kw = term;
			}
		} else {
			for (const term of query) mapSI.add(shardOf(term, this._shards.map));
		}

		await Promise.all([
			...[...mapSI].map((si) => this._mapShard(si)),
			...[...ctxSI].map((si) => this._ctxShard(si)),
		]);

		// Phase 2: build score maps from cache (all hits) ─────────────────────
		const scoreMaps: Map<string, number>[] = [];

		if (useCtx) {
			let kw = query[0];
			for (let i = 1; i < query.length; i++) {
				const term = query[i];
				const swap = bidir && term > kw;
				const ct = swap ? term : kw;
				const it = swap ? kw : term;
				const bkts = this._ctxSync(shardOf(ct, this._shards.ctx))
					?.get(ct)
					?.get(it);
				if (bkts?.length) scoreMaps.push(this._toScoreMap(bkts, res));
				kw = term;
			}
		} else {
			for (const term of query) {
				const bkts = this._mapSync(shardOf(term, this._shards.map))?.get(term);
				if (bkts?.length) scoreMaps.push(this._toScoreMap(bkts, res));
			}
		}

		if (!scoreMaps.length) return [];

		// Phase 3: merge ───────────────────────────────────────────────────────
		const merged = suggest ? this._suggest(scoreMaps) : this._intersect(scoreMaps);

		// Phase 4: tag filter ──────────────────────────────────────────────────
		if (tags?.length) {
			for (const ts of this._resolveTagSets(tags)) {
				for (const id of merged.keys()) {
					if (!ts.has(id)) merged.delete(id);
				}
			}
		}

		if (!merged.size) return [];

		// Phase 5: sort, paginate, format ─────────────────────────────────────
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

		return enrich ? this._enrichItems(result, resolve) : result;
	}

	// ── tag() ─────────────────────────────────────────────────────────────────

	tag(tag: string, limit = 0, offset = 0, enrich = false): Promise<any[]> {
		const ids = this._tag.get(tag) ?? [];
		const page = ids.slice(offset, limit ? offset + limit : undefined);
		return Promise.resolve(
			enrich ? this._enrichItems(page, true) : page.map((id) => this._typed(id)),
		);
	}

	// ── enrich() ──────────────────────────────────────────────────────────────

	async enrich(ids: string | string[]): Promise<{ id: any; doc: unknown }[]> {
		const arr = Array.isArray(ids) ? ids : [ids];

		// Preload all needed store shards in parallel
		const shardSet = new Set(
			arr.map((id) => shardOf(String(id), this._shards.store)),
		);
		await Promise.all([...shardSet].map((si) => this._storeShard(si)));

		return arr.map((rawId) => {
			const id = String(rawId);
			const doc = this._storeSync(shardOf(id, this._shards.store))?.get(id) ?? null;
			return { id: this._typed(id), doc };
		});
	}

	// ── has() ─────────────────────────────────────────────────────────────────

	async has(id: string | number): Promise<boolean> {
		const sid = String(id);
		return (await this._regShard(shardOf(sid, this._shards.reg))).has(sid);
	}

	// ── remove() ──────────────────────────────────────────────────────────────

	async remove(ids: string | number | (string | number)[]): Promise<void> {
		if (ids == null) return;
		const arr = (Array.isArray(ids) ? ids : [ids]).map(String);
		if (!arr.length) return;
		await this._removeBatch(arr);
		await this._flush();
	}

	// ── transaction() — passthrough stub ─────────────────────────────────────

	async transaction(
		task: (ctx: this) => Promise<void>,
		cb?: () => void,
	): Promise<void> {
		await task.call(this, this);
		cb?.();
	}

	// ── info() ────────────────────────────────────────────────────────────────

	info(): Record<string, number> {
		return {
			cacheEntries: this._cache.size,
			cacheLimit: this._maxCache,
			tags: this._tag.size,
		};
	}

	// ── Private — data helpers ────────────────────────────────────────────────

	/**
	 * Merge incoming score-buckets for `term` into the `data` map.
	 * Accumulates ref-keys into `pendingRefs` for later batch application
	 * to the ref shard index.
	 */
	private _mergeBkts(
		data: MapShardData,
		term: string,
		incoming: Bkts,
		refKey: string,
		pendingRefs: Map<string, Set<string>>,
	): void {
		let existing = data.get(term);
		if (!existing) {
			existing = [];
			data.set(term, existing);
		}

		for (let i = 0; i < incoming.length; i++) {
			const src = incoming[i];
			if (!src?.length) continue;
			if (this.type === '' && typeof src[0] === 'number') this.type = 'number';

			const dst = (existing[i] ??= []);
			const seen = new Set(dst);

			for (const rawId of src) {
				const id = String(rawId);
				if (!seen.has(id)) {
					seen.add(id);
					dst.push(id);
				}
				let refs = pendingRefs.get(id);
				if (!refs) {
					refs = new Set();
					pendingRefs.set(id, refs);
				}
				refs.add(refKey);
			}
		}
	}

	/**
	 * Two-phase batch removal.
	 *
	 * Phase A: load all ref shards in parallel to discover which map/ctx/store/reg
	 *          shards are affected — then load those in parallel.
	 * Phase B: apply all deletions in-memory with no further I/O.
	 */
	private async _removeBatch(ids: string[]): Promise<void> {
		// Phase A-1: load ref shards ──────────────────────────────────────────
		const refSI = new Set(ids.map((id) => shardOf(id, this._shards.ref)));
		await Promise.all([...refSI].map((si) => this._refShard(si)));

		// Collect mutations grouped by target shard
		const mapRm = new Map<number, { term: string; id: string }[]>();
		const ctxRm = new Map<number, { ct: string; inner: string; id: string }[]>();
		const storeRm = new Map<number, string[]>();
		const regRm = new Map<number, string[]>();

		for (const id of ids) {
			const rsi = shardOf(id, this._shards.ref);
			const refData = this._refSync(rsi);
			const refs = refData?.get(id);

			if (refs) {
				for (const ref of refs) {
					const p0 = ref.indexOf('|');
					const kind = ref.slice(0, p0);
					const rest = ref.slice(p0 + 1);

					if (kind === 'map') {
						const si = shardOf(rest, this._shards.map);
						const g = mapRm.get(si) ?? [];
						mapRm.set(si, g);
						g.push({ term: rest, id });
					} else {
						const p1 = rest.indexOf('|');
						const ct = rest.slice(0, p1);
						const inner = rest.slice(p1 + 1);
						const si = shardOf(ct, this._shards.ctx);
						const g = ctxRm.get(si) ?? [];
						ctxRm.set(si, g);
						g.push({ ct, inner, id });
					}
				}
				refData!.delete(id);
				this._markDirty(this._pr(rsi));
			}

			const ssi = shardOf(id, this._shards.store);
			(storeRm.get(ssi) ?? (storeRm.set(ssi, []), storeRm.get(ssi)!)).push(id);

			const regi = shardOf(id, this._shards.reg);
			(regRm.get(regi) ?? (regRm.set(regi, []), regRm.get(regi)!)).push(id);
		}

		// Phase A-2: load all affected shards in parallel ─────────────────────
		await Promise.all([
			...[...mapRm.keys()].map((si) => this._mapShard(si)),
			...[...ctxRm.keys()].map((si) => this._ctxShard(si)),
			...[...storeRm.keys()].map((si) => this._storeShard(si)),
			...[...regRm.keys()].map((si) => this._regShard(si)),
		]);

		// Phase B: apply mutations (pure in-memory) ───────────────────────────
		for (const [si, removes] of mapRm) {
			const data = this._mapSync(si)!;
			for (const { term, id } of removes) this._stripId(data.get(term), id);
			this._markDirty(this._pm(si));
		}

		for (const [si, removes] of ctxRm) {
			const data = this._ctxSync(si)!;
			for (const { ct, inner, id } of removes) {
				this._stripId(data.get(ct)?.get(inner), id);
			}
			this._markDirty(this._pc(si));
		}

		for (const [si, sids] of storeRm) {
			const data = this._storeSync(si)!;
			for (const id of sids) data.delete(id);
			this._markDirty(this._ps(si));
		}

		for (const [si, rids] of regRm) {
			const data = this._regSync(si)!;
			for (const id of rids) data.delete(id);
			this._markDirty(this._pReg(si));
		}

		// Tag cleanup — in RAM, no shard loading needed
		const idSet = new Set(ids);
		for (const tagIds of this._tag.values()) {
			for (let i = tagIds.length - 1; i >= 0; i--) {
				if (idSet.has(tagIds[i])) {
					tagIds.splice(i, 1);
					this._tagDirty = true;
				}
			}
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

	/** Group a Map<string, V> by shardOf(key, count). */
	private _groupBy<V>(src: Map<string, V>, count: number): Map<number, Map<string, V>> {
		const out = new Map<number, Map<string, V>>();
		for (const [key, val] of src) {
			const si = shardOf(key, count);
			let g = out.get(si);
			if (!g) {
				g = new Map();
				out.set(si, g);
			}
			g.set(key, val);
		}
		return out;
	}

	// ── Private — search helpers ──────────────────────────────────────────────

	private _toScoreMap(bkts: Bkts, res: number): Map<string, number> {
		const m = new Map<string, number>();
		for (let i = 0; i < bkts.length; i++) {
			const bkt = bkts[i];
			if (!bkt?.length) continue;
			const score = res - i;
			for (const id of bkt) {
				if ((m.get(id) ?? -1) < score) m.set(id, score);
			}
		}
		return m;
	}

	/** Intersection with MAX aggregate — mirrors ZINTERSTORE AGGREGATE MAX. */
	private _intersect(maps: Map<string, number>[]): Map<string, number> {
		if (maps.length === 1) return maps[0];
		maps.sort((a, b) => a.size - b.size);
		const out = new Map<string, number>();
		next: for (const [id, s0] of maps[0]) {
			let max = s0;
			for (let k = 1; k < maps.length; k++) {
				const s = maps[k].get(id);
				if (s === undefined) continue next;
				if (s > max) max = s;
			}
			out.set(id, max);
		}
		return out;
	}

	/**
	 * Suggest merge — replicates the two-step ZINTERSTORE + ZUNIONSTORE trick.
	 * Union all score maps (SUM), then boost ids present in ALL term maps by
	 * n × their intersection sum so they rise above partial matches.
	 */
	private _suggest(maps: Map<string, number>[]): Map<string, number> {
		const n = maps.length;
		const union = new Map<string, number>();
		for (const m of maps) {
			for (const [id, s] of m) union.set(id, (union.get(id) ?? 0) + s);
		}
		maps.sort((a, b) => a.size - b.size);
		next: for (const [id, s0] of maps[0]) {
			let sum = s0;
			for (let k = 1; k < maps.length; k++) {
				const s = maps[k].get(id);
				if (s === undefined) continue next;
				sum += s;
			}
			union.set(id, (union.get(id) ?? 0) + sum * n);
		}
		return union;
	}

	// ── Private — output helpers ──────────────────────────────────────────────

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

	private async _enrichItems(result: any[], resolve: boolean): Promise<any[]> {
		if (resolve) return this.enrich(result as string[]);
		// Preload all store shards for all buckets in one parallel sweep
		const allIds: string[] = [];
		for (const bkt of result) if (bkt) for (const id of bkt) allIds.push(String(id));
		const si = new Set(allIds.map((id) => shardOf(id, this._shards.store)));
		await Promise.all([...si].map((i) => this._storeShard(i)));
		return result.map((bkt) =>
			bkt
				? bkt.map((rawId: any) => {
						const id = String(rawId);
						return {
							id: this._typed(id),
							doc:
								this._storeSync(shardOf(id, this._shards.store))?.get(
									id,
								) ?? null,
						};
					})
				: undefined,
		);
	}

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

	private _iterReg(reg: any): string[] {
		if (reg instanceof Set) return [...reg].map(String);
		if (reg instanceof Map) return [...reg.keys()].map(String);
		return [];
	}

	private _typed(id: string): string | number {
		return this.type === 'number' ? parseInt(id, 10) : id;
	}
}
