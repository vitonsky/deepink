import { IFilesStorage } from '../../files';

export class CacheableBuffer<
	ResourcesMap extends {
		[K in string]: ArrayBuffer;
	},
> {
	constructor(
		private readonly files: IFilesStorage,
		private readonly fetchers: {
			[K in keyof ResourcesMap]: () => Promise<ResourcesMap[K] | null>;
		},
	) {}

	async get<K extends string & keyof ResourcesMap>(
		name: K,
	): Promise<ResourcesMap[K] | null> {
		const cachedValue = await this.files.get(name);
		if (cachedValue) return cachedValue as ResourcesMap[K];

		const result = await this.fetchers[name]();

		// Write cache
		if (result) {
			await this.files.write(name, result);
		}

		return result;
	}
}
