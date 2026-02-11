import { IFilesStorage } from '.';

/**
 * Overlay FS is just translate calls to an original FS
 */
export class OverlayFS implements IFilesStorage {
	constructor(protected readonly storage: IFilesStorage) {}

	async write(path: string, buffer: ArrayBuffer) {
		return this.storage.write(path, buffer);
	}

	async get(path: string) {
		return this.storage.get(path);
	}
	async delete(paths: string[]) {
		return this.storage.delete(paths);
	}
	async list() {
		return this.storage.list();
	}
}
