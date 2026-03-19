import { transfer } from 'comlink';

import { IFilesStorage } from '.';

export class ComlinkHostFS implements IFilesStorage {
	constructor(protected readonly storage: IFilesStorage) {}

	async write(path: string, buffer: ArrayBuffer) {
		await this.storage.write(path, buffer);
	}

	async get(path: string) {
		const result = this.storage.get(path);
		return transfer(result, [result]);
	}
	async delete(paths: string[]) {
		await this.storage.delete(paths);
	}
	async list() {
		const result = this.storage.list();
		return transfer(result, [result]);
	}
}

export class ComlinkWorkerFS implements IFilesStorage {
	constructor(protected readonly storage: IFilesStorage) {}

	async write(path: string, buffer: ArrayBuffer) {
		await this.storage.write(path, transfer(buffer, [buffer]));
	}

	async get(path: string) {
		return this.storage.get(path);
	}
	async delete(paths: string[]) {
		return this.storage.delete(transfer(paths, [paths]));
	}
	async list() {
		return this.storage.list();
	}
}
