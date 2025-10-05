import { IFilesStorage } from '@core/features/files';
import { getResolvedPath } from '@utils/fs/paths';

// TODO: cover all implementations with tests
export class InMemoryFS implements IFilesStorage {
	protected readonly storage: Record<string, ArrayBuffer>;
	constructor(initData: Record<string, ArrayBuffer> = {}) {
		this.storage = {};

		for (const [path, buffer] of Object.entries(initData)) {
			this.storage[getResolvedPath(path, '/')] = new Uint8Array(buffer).buffer;
		}
	}

	async write(path: string, buffer: ArrayBuffer) {
		this.storage[getResolvedPath(path, '/')] = new Uint8Array(buffer).buffer;
	}

	async get(path: string) {
		return this.storage[getResolvedPath(path, '/')];
	}
	async delete(paths: string[]) {
		paths.forEach((path) => {
			delete this.storage[getResolvedPath(path, '/')];
		});
	}
	async list() {
		return Object.keys(this.storage);
	}
}
