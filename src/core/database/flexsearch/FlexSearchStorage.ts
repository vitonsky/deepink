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
 */

import { LRUCache } from 'lru-cache';
import type { IFilesStorage } from '@core/features/files';
import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';

// ─── shard configuration ──────────────────────────────────────────────────────

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

// ─── msgpack codec ────────────────────────────────────────────────────────────

const MSGPACK_CODEC = new ExtensionCodec();

// Extension type 0 — Map
MSGPACK_CODEC.register({
	type: 0,
	encode: (v) =>
		v instanceof Map ? encode([...v], { extensionCodec: MSGPACK_CODEC }) : null,
	decode: (b) =>
		new Map(decode(b, { extensionCodec: MSGPACK_CODEC }) as [unknown, unknown][]),
});

// Extension type 1 — Set
MSGPACK_CODEC.register({
	type: 1,
	encode: (v) =>
		v instanceof Set ? encode([...v], { extensionCodec: MSGPACK_CODEC }) : null,
	decode: (b) => new Set(decode(b, { extensionCodec: MSGPACK_CODEC }) as unknown[]),
});

function encodeShard(v: unknown): ArrayBuffer {
	const encoded = encode(v, { extensionCodec: MSGPACK_CODEC });
	// encoded.buffer may be larger than encoded itself.
	// Slice using the view's byteOffset and byteLength to get exactly the written bytes.
	return encoded.buffer.slice(
		encoded.byteOffset,
		encoded.byteOffset + encoded.byteLength,
	);
}

function decodeShard<T>(buf: ArrayBuffer | Uint8Array): T {
	return decode(buf, { extensionCodec: MSGPACK_CODEC }) as T;
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

type CacheEntry =
	| { cat: 'map'; data: MapShardData; dirty: boolean }
	| { cat: 'ctx'; data: CtxShardData; dirty: boolean }
	| { cat: 'store'; data: StoreShardData; dirty: boolean }
	| { cat: 'ref'; data: RefShardData; dirty: boolean }
	| { cat: 'reg'; data: RegShardData; dirty: boolean };

// ─── utilities ────────────────────────────────────────────────────────────────

/** djb2-inspired hash; deterministically maps a string key to a shard index. */
function shardIndex(key: string, count: number): number {
	let h = 5381;
	for (let i = 0; i < key.length; i++) h = (Math.imul(h, 33) ^ key.charCodeAt(i)) | 0;
	return (h >>> 0) % count;
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
	let v = map.get(key);
	if (v === undefined) {
		v = init();
		map.set(key, v);
	}
	return v;
}

/** Group a `Map<string, V>` by `shardIndex(key, count)`. */
function groupByShard<V>(
	src: Map<string, V>,
	count: number,
): Map<number, Map<string, V>> {
	const out = new Map<number, Map<string, V>>();
	for (const [key, val] of src)
		getOrInit(out, shardIndex(key, count), () => new Map()).set(key, val);
	return out;
}

// ─── FlexSearch protocol types ────────────────────────────────────────────────

interface FlexCommitTask {
	readonly del?: string | number;
}

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

interface FlexSearchIndex {
	db?: any;
	readonly index?: unknown;
	mount?: (db: FlexSearchStorage) => Promise<void>;
	resolution?: number;
	resolution_ctx?: number;
	bidirectional?: boolean;
}

interface SearchOptions {
	readonly depth?: number | boolean;
	readonly bidirectional?: boolean;
}

// ─── small inline dedup threshold ────────────────────────────────────────────

/**
 * Below this bucket length, `Array.includes()` is used for deduplication.
 * Above it a persistent Set is maintained alongside the bucket.
 * Avoids reconstructing a Set on every merge for small buckets.
 */
const DEDUP_THRESHOLD = 32;

// ─── main class ───────────────────────────────────────────────────────────────

export class FlexSearchStorage {
	// ── FlexSearch adapter protocol ───────────────────────────────────────────

	public readonly support_tag_search = true;
	public readonly fastupdate = true;
	public resolution_ctx = 9;

	public resolution = 9;
	public db: IFilesStorage;
	public type: '' | 'number' = '';

	// ── private state ─────────────────────────────────────────────────────────

	private readonly _storage: IFilesStorage;
	private readonly _name: string;
	private readonly _field: string;
	private readonly _shards: ShardConfig;
	private readonly _maxCache: number;

	/**
	 * LRU cache backed by `lru-cache`.
	 * The `dispose` callback flushes dirty shards to storage on eviction,
	 * replacing the manual eviction logic from the previous implementation.
	 */
	private readonly _cache: LRUCache<string, CacheEntry>;

	/** Tags kept fully in RAM — single small file, queried on every tag search. */
	private readonly _tags = new Map<string, string[]>();
	private _tagsDirty = false;

	/**
	 * Dedup sets for score buckets that exceed DEDUP_THRESHOLD.
	 * Keyed by `path:bucketIndex` so they survive across merges without
	 * being reconstructed on every commit.
	 */
	private readonly _dedupSets = new Map<string, Set<string>>();

	private _isOpen = false;
	private _bidirectional = false;

	/**
	 * Ref index is only needed to serve remove().
	 * Disabled during bulk indexing; enabled on the first remove() call.
	 */
	private _trackRefs = false;

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
		this.db = storage;

		if (typeof name === 'string') {
			this._name = sanitizeName(name) || 'flexsearch';
			this._field = config.field ? `-${sanitizeName(config.field)}` : '';
		} else {
			this._name = sanitizeName(name.name ?? 'flexsearch') || 'flexsearch';
			this._field = name.field ? `-${sanitizeName(name.field)}` : '';
		}

		this._shards = { ...DEFAULT_SHARDS, ...config.shards };

		// Default cache large enough to hold the entire working set so that
		// no eviction occurs during bulk index building.
		const { map, ctx, store, ref, reg } = this._shards;
		this._maxCache = config.cacheSize ?? map + ctx + store + ref + reg;

		this._cache = new LRUCache<string, CacheEntry>({
			max: this._maxCache,
			// Flush dirty shards to storage automatically on eviction.
			dispose: (entry, path) => {
				if (entry.dirty) void this._writeToDisk(path, entry);
			},
		});
	}

	// ── path helper ───────────────────────────────────────────────────────────

	private _path(cat: ShardCat | 'tag', i: number | '' = ''): string {
		const field = cat === 'store' || cat === 'tag' ? '' : this._field;
		return `/${this._name}/${cat}${field}/${i}`;
	}

	// ── shard loading ─────────────────────────────────────────────────────────

	/**
	 * Return a shard's typed data, loading from storage if necessary.
	 *
	 * The single type assertion `entry.data as ShardDataFor<C>` is safe by
	 * architectural contract: every path is owned by exactly one category,
	 * so `entry.data` is always the correct concrete type for `C`.
	 */
	private async _loadShard<C extends ShardCat>(
		path: string,
		cat: C,
	): Promise<ShardDataFor<C>> {
		const cached = this._cache.get(path);
		if (cached) return cached.data as ShardDataFor<C>;

		const buf = await this._storage.get(path);
		const entry = buf ? this._decodeEntry(cat, buf) : this._emptyEntry(cat);
		this._cache.set(path, entry);
		return entry.data as ShardDataFor<C>;
	}

	/**
	 * Load multiple shards in parallel, returning `Map<shardIndex, data>`.
	 * Callers hold direct references — immune to cache eviction after the await.
	 */
	private async _loadShards<D>(
		indices: Iterable<number>,
		cat: ShardCat,
	): Promise<Map<number, D>> {
		const pairs = await Promise.all(
			[...indices].map(
				async (si): Promise<[number, D]> => [
					si,
					(await this._loadShard(this._path(cat, si), cat)) as D,
				],
			),
		);
		return new Map(pairs);
	}

	// ── persistence ───────────────────────────────────────────────────────────

	private async _flush(): Promise<void> {
		const writes: Promise<void>[] = [];

		for (const [path, entry] of this._cache.entries()) {
			if (!entry.dirty) continue;
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
				/* already absent */
			}
		} else {
			await this._storage.write(path, encodeShard(entry.data));
		}
	}

	private async _flushTags(): Promise<void> {
		if (this._tags.size > 0) {
			await this._storage.write(
				this._path('tag'),
				encodeShard(Object.fromEntries(this._tags)),
			);
		} else {
			try {
				await this._storage.delete([this._path('tag')]);
			} catch {
				/* already absent */
			}
		}
	}

	// ── codec dispatch ────────────────────────────────────────────────────────

	private _decodeEntry(cat: ShardCat, buf: ArrayBuffer): CacheEntry {
		switch (cat) {
			case 'map':
				return { cat, data: decodeShard<MapShardData>(buf), dirty: false };
			case 'ctx':
				return { cat, data: decodeShard<CtxShardData>(buf), dirty: false };
			case 'store':
				return { cat, data: decodeShard<StoreShardData>(buf), dirty: false };
			case 'ref':
				return { cat, data: decodeShard<RefShardData>(buf), dirty: false };
			case 'reg':
				return { cat, data: decodeShard<RegShardData>(buf), dirty: false };
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
		const buf = await this._storage.get(this._path('tag'));
		if (buf) {
			for (const [k, v] of Object.entries(
				decodeShard<Record<string, string[]>>(buf),
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
		const all = await this._storage.list();
		const ours = all.filter((p) => p.startsWith(`/${this._name}/`));
		if (ours.length) await this._storage.delete(ours);
	}

	// ── commit() ──────────────────────────────────────────────────────────────

	async commit(state: FlexCommitState): Promise<void> {
		// ① Drain pending deletions.
		const tasks = state.commit_task ?? [];
		state.commit_task = [];
		const pendingDeletes = tasks
			.filter((t): t is { del: string | number } => t.del != null)
			.map((t) => String(t.del));
		if (pendingDeletes.length) await this._removeBatch(pendingDeletes);
		if (!state.reg?.size && !pendingDeletes.length) return;

		// pendingRefs: docId → refKeys, built only when ref tracking is active.
		const pendingRefs = this._trackRefs ? new Map<string, Set<string>>() : null;

		// ② map shards.
		if (state.map?.size) {
			const byShard = groupByShard(state.map, this._shards.map);
			const shards = await this._loadShards<MapShardData>(byShard.keys(), 'map');
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
				this._markDirty(this._path('map', si));
			}
		}

		// ③ ctx shards.
		if (state.ctx?.size) {
			const byShard = groupByShard(state.ctx, this._shards.ctx);
			const shards = await this._loadShards<CtxShardData>(byShard.keys(), 'ctx');
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
				this._markDirty(this._path('ctx', si));
			}
		}

		// ④ ref shards — skipped during bulk indexing when _trackRefs is false.
		if (pendingRefs?.size) {
			const byRefShard = new Map<number, Map<string, Set<string>>>();
			for (const [docId, refKeys] of pendingRefs) {
				getOrInit(
					byRefShard,
					shardIndex(docId, this._shards.ref),
					() => new Map(),
				).set(docId, refKeys);
			}
			const shards = await this._loadShards<RefShardData>(byRefShard.keys(), 'ref');
			for (const [si, updates] of byRefShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const [docId, refKeys] of updates) {
					const existing = getOrInit(data, docId, () => new Set<string>());
					for (const key of refKeys) existing.add(key);
				}
				this._markDirty(this._path('ref', si));
			}
		}

		// ⑤ store shards.
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
			const shards = await this._loadShards<StoreShardData>(
				byShard.keys(),
				'store',
			);
			for (const [si, docs] of byShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const [docId, doc] of docs) data.set(docId, doc);
				this._markDirty(this._path('store', si));
			}
		}

		// ⑥ registry shards.
		if (!state.bypass && state.reg?.size) {
			const byShard = new Map<number, string[]>();
			for (const rawId of this._iterRegistry(state.reg)) {
				getOrInit(byShard, shardIndex(rawId, this._shards.reg), () => []).push(
					rawId,
				);
			}
			const shards = await this._loadShards<RegShardData>(byShard.keys(), 'reg');
			for (const [si, ids] of byShard) {
				const data = shards.get(si);
				if (!data) continue;
				for (const id of ids) data.add(id);
				this._markDirty(this._path('reg', si));
			}
		}

		// ⑦ tags.
		if (state.tag?.size) {
			for (const [tag, ids] of state.tag) {
				const existing = new Set(this._tags.get(tag));
				for (const id of ids) existing.add(String(id));
				this._tags.set(tag, [...existing]);
			}
			this._tagsDirty = true;
		}

		// ⑧ Clear FlexSearch accumulators.
		state.map?.clear();
		state.ctx?.clear();
		state.tag?.clear();
		state.store?.clear();
		if (!state.document) state.reg?.clear();

		// ⑨ Flush dirty shards.
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
				false,
				resolve,
				enrich,
				tags,
			);
		}

		const buckets = ctx
			? (
					await this._loadShard(
						this._path('ctx', shardIndex(ctx, this._shards.ctx)),
						'ctx',
					)
				)
					.get(ctx)
					?.get(key)
			: (
					await this._loadShard(
						this._path('map', shardIndex(key, this._shards.map)),
						'map',
					)
				).get(key);

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

		// Phase 1: Collect required shard indices.
		const mapIndices = new Set<number>();
		const ctxIndices = new Set<number>();

		if (useCtx) {
			let pivot = query[0];
			for (let i = 1; i < query.length; i++) {
				const term = query[i];
				ctxIndices.add(
					shardIndex(bidir && term > pivot ? term : pivot, this._shards.ctx),
				);
				pivot = term;
			}
		} else {
			for (const term of query) mapIndices.add(shardIndex(term, this._shards.map));
		}

		// Phase 2: Preload all required shards in parallel.
		const [mapShards, ctxShards] = await Promise.all([
			this._loadShards<MapShardData>(mapIndices, 'map'),
			this._loadShards<CtxShardData>(ctxIndices, 'ctx'),
		]);

		// Phase 3: Build per-term score maps.
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

		// Phase 4: Merge.
		const merged = suggest
			? this._mergeUnion(scoreMaps)
			: this._mergeIntersect(scoreMaps);

		// Phase 5: Tag filter.
		if (tags?.length) {
			for (const tagSet of this._resolveTagSets(tags)) {
				for (const id of merged.keys()) {
					if (!tagSet.has(id)) merged.delete(id);
				}
			}
		}

		if (!merged.size) return [];

		// Phase 6: Sort, paginate, format.
		let entries = [...merged.entries()].sort(([, a], [, b]) => b - a);
		if (offset) entries = entries.slice(offset);
		if (limit) entries = entries.slice(0, limit);

		let result: unknown[];
		if (resolve) {
			result = entries.map(([id]) => this._typedId(id));
		} else {
			const bucketArr: ((string | number)[] | undefined)[] = [];
			for (const [id, score] of entries) {
				const bi = Math.max(resolution - score, 0);
				const bucket = bucketArr[bi];
				if (!bucket) bucketArr[bi] = [this._typedId(id)];
				else bucket.push(this._typedId(id));
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
		if (enrich) return this._enrichItems(page, true);
		return Promise.resolve(page);
	}

	// ── enrich() ──────────────────────────────────────────────────────────────

	async enrich(
		ids: string | string[],
	): Promise<{ id: string | number; doc: unknown }[]> {
		const idList = Array.isArray(ids) ? ids : [ids];
		const shards = await this._loadShards<StoreShardData>(
			new Set(idList.map((id) => shardIndex(id, this._shards.store))),
			'store',
		);
		return idList.map((id) => ({
			id: this._typedId(id),
			doc: shards.get(shardIndex(id, this._shards.store))?.get(id) ?? null,
		}));
	}

	// ── has() ─────────────────────────────────────────────────────────────────

	async has(id: string | number): Promise<boolean> {
		const docId = String(id);
		return (
			await this._loadShard(
				this._path('reg', shardIndex(docId, this._shards.reg)),
				'reg',
			)
		).has(docId);
	}

	// ── remove() ──────────────────────────────────────────────────────────────

	async remove(ids: string | number | (string | number)[]): Promise<void> {
		const list = (Array.isArray(ids) ? ids : [ids]).map(String).filter(Boolean);
		if (!list.length) return;
		// Enable ref tracking from this point forward so future commits
		// maintain the ref index needed to serve remove().
		this._trackRefs = true;
		await this._removeBatch(list);
		await this._flush();
	}

	// ── transaction() ─────────────────────────────────────────────────────────

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

	// ── private — dirty marking ───────────────────────────────────────────────

	private _markDirty(path: string): void {
		const entry = this._cache.get(path);
		if (entry) entry.dirty = true;
	}

	// ── private — score bucket merge ──────────────────────────────────────────

	/**
	 * Merge incoming score-buckets for `term` into `data`.
	 *
	 * Deduplication strategy:
	 *   - Small buckets (< DEDUP_THRESHOLD): Array.includes() — no allocation.
	 *   - Large buckets: persistent Set stored in `_dedupSets` — never reconstructed.
	 */
	private _mergeScoreBuckets(
		data: MapShardData,
		term: string,
		incoming: ScoreBuckets,
		refKey: string,
		pendingRefs: Map<string, Set<string>> | null,
	): void {
		const existing = getOrInit(data, term, () => []);

		for (let i = 0; i < incoming.length; i++) {
			const src = incoming[i];
			if (!src?.length) continue;
			if (this.type === '' && !isNaN(Number(src[0]))) this.type = 'number';

			const dst = (existing[i] ??= []);
			const dedupKey = `${term}:${i}`;

			for (const rawId of src) {
				const id = String(rawId);

				if (dst.length < DEDUP_THRESHOLD) {
					if (!dst.includes(id)) dst.push(id);
				} else {
					// Promote to persistent Set on first overflow.
					let dedupSet = this._dedupSets.get(dedupKey);
					if (!dedupSet) {
						dedupSet = new Set(dst);
						this._dedupSets.set(dedupKey, dedupSet);
					}
					if (!dedupSet.has(id)) {
						dedupSet.add(id);
						dst.push(id);
					}
				}

				if (pendingRefs) getOrInit(pendingRefs, id, () => new Set()).add(refKey);
			}
		}
	}

	// ── private — batch removal ───────────────────────────────────────────────

	private async _removeBatch(ids: string[]): Promise<void> {
		// Phase A: Load ref shards to discover affected shard indices.
		const refShards = await this._loadShards<RefShardData>(
			new Set(ids.map((id) => shardIndex(id, this._shards.ref))),
			'ref',
		);

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
					const pipe = ref.indexOf('|');
					const kind = ref.slice(0, pipe);
					const rest = ref.slice(pipe + 1);
					if (kind === 'map') {
						getOrInit(
							mapRemovals,
							shardIndex(rest, this._shards.map),
							() => [],
						).push({ term: rest, id });
					} else {
						const pipe2 = rest.indexOf('|');
						const ctTerm = rest.slice(0, pipe2);
						const term = rest.slice(pipe2 + 1);
						getOrInit(
							ctxRemovals,
							shardIndex(ctTerm, this._shards.ctx),
							() => [],
						).push({ ctTerm, term, id });
					}
				}
				refData.delete(id);
				this._markDirty(this._path('ref', refSI));
			}

			getOrInit(storeRemovals, shardIndex(id, this._shards.store), () => []).push(
				id,
			);
			getOrInit(regRemovals, shardIndex(id, this._shards.reg), () => []).push(id);
		}

		// Phase B: Load all affected shards in parallel.
		const [mapShards, ctxShards, storeShards, regShards] = await Promise.all([
			this._loadShards<MapShardData>(mapRemovals.keys(), 'map'),
			this._loadShards<CtxShardData>(ctxRemovals.keys(), 'ctx'),
			this._loadShards<StoreShardData>(storeRemovals.keys(), 'store'),
			this._loadShards<RegShardData>(regRemovals.keys(), 'reg'),
		]);

		// Phase C: Apply mutations in-memory.
		for (const [si, removals] of mapRemovals) {
			const data = mapShards.get(si);
			if (!data) continue;
			for (const { term, id } of removals)
				this._removeIdFromBuckets(data.get(term), id);
			this._markDirty(this._path('map', si));
		}

		for (const [si, removals] of ctxRemovals) {
			const data = ctxShards.get(si);
			if (!data) continue;
			for (const { ctTerm, term, id } of removals)
				this._removeIdFromBuckets(data.get(ctTerm)?.get(term), id);
			this._markDirty(this._path('ctx', si));
		}

		for (const [si, docIds] of storeRemovals) {
			const data = storeShards.get(si);
			if (!data) continue;
			for (const id of docIds) data.delete(id);
			this._markDirty(this._path('store', si));
		}

		for (const [si, docIds] of regRemovals) {
			const data = regShards.get(si);
			if (!data) continue;
			for (const id of docIds) data.delete(id);
			this._markDirty(this._path('reg', si));
		}

		// Tags live in RAM — no shard I/O needed.
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

	private _removeIdFromBuckets(buckets: ScoreBuckets | undefined, id: string): void {
		if (!buckets) return;
		for (const bucket of buckets) {
			if (!bucket) continue;
			const pos = bucket.indexOf(id);
			if (pos !== -1) bucket.splice(pos, 1);
		}
	}

	// ── private — search helpers ──────────────────────────────────────────────

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

	private _mergeIntersect(maps: Map<string, number>[]): Map<string, number> {
		if (maps.length === 1) return maps[0];
		maps.sort((a, b) => a.size - b.size);
		const out = new Map<string, number>();
		outer: for (const [id, score0] of maps[0]) {
			let max = score0;
			for (let k = 1; k < maps.length; k++) {
				const s = maps[k].get(id);
				if (s === undefined) continue outer;
				if (s > max) max = s;
			}
			out.set(id, max);
		}
		return out;
	}

	private _mergeUnion(maps: Map<string, number>[]): Map<string, number> {
		const n = maps.length;
		const union = new Map<string, number>();
		for (const m of maps) {
			for (const [id, s] of m) union.set(id, (union.get(id) ?? 0) + s);
		}
		maps.sort((a, b) => a.size - b.size);
		outer: for (const [id, s0] of maps[0]) {
			let sum = s0;
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
			if (!bucket) out[bi] = [this._typedId(id)];
			else bucket.push(this._typedId(id));
		}
		return out;
	}

	private async _enrichItems(result: unknown[], resolve: boolean): Promise<unknown[]> {
		if (resolve) return this.enrich(result as string[]);

		const allIds: string[] = [];
		for (const bucket of result) {
			if (Array.isArray(bucket)) for (const id of bucket) allIds.push(String(id));
		}
		const shards = await this._loadShards<StoreShardData>(
			new Set(allIds.map((id) => shardIndex(id, this._shards.store))),
			'store',
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

	private _iterRegistry(
		reg: Set<string | number> | Map<string | number, unknown>,
	): string[] {
		if (reg instanceof Set) return [...reg].map(String);
		if (reg instanceof Map) return [...reg.keys()].map(String);
		return [];
	}

	private _typedId(id: string): string | number {
		return this.type === 'number' ? parseInt(id, 10) : id;
	}
}
