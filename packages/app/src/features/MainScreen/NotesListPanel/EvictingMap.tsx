/**
 * The FIFO map that evict the oldest values
 */
export class EvictingMap<P extends unknown> {
	constructor(
		private readonly config: {
			readonly size: number;
		},
	) {}

	private data = new Map<string, P>();
	public add(values: Record<string, P> | (readonly [string, P])[]) {
		const newMap = new Map([
			...this.data,
			...(Array.isArray(values) ? values : Object.entries(values)),
		]);

		// Evict an extra values
		const extraKeys = newMap.size - this.config.size;
		if (extraKeys > 0) {
			newMap
				.keys()
				.take(extraKeys)
				.forEach((key) => newMap.delete(key));
		}

		this.data = newMap;
	}

	public delete(keys: string[]) {
		const newMap = new Map(this.data);
		for (const key of keys) {
			newMap.delete(key);
		}

		this.data = newMap;
	}

	public has(key: string) {
		return this.data.has(key);
	}

	public get(key: string) {
		return this.data.get(key);
	}

	public getAll() {
		return this.data.entries().toArray();
	}

	public size() {
		return this.data.size;
	}
}
