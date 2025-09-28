import { IFilesStorage } from '@core/features/files';

export class InMemoryFS implements IFilesStorage {
	protected readonly storage: Record<string, ArrayBuffer>;
	constructor(initData?: Record<string, ArrayBuffer>) {
		this.storage = { ...initData };
	}

	async write(path: string, buffer: ArrayBuffer) {
		this.storage[path] = new Uint8Array(buffer).buffer;
	}
	async get(path: string) {
		return this.storage[path];
	}
	async delete(paths: string[]) {
		paths.forEach((path) => {
			delete this.storage[path];
		});
	}
	async list() {
		return Object.keys(this.storage);
	}
}
