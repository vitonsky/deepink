import { transfer } from 'comlink';

import { OverlayFS } from './OverlayFS';
import { IFilesStorage } from '.';

export class ComlinkHostFS extends OverlayFS implements IFilesStorage {
	async get(path: string) {
		const result = await this.storage.get(path);
		return result ? transfer(result, [result]) : null;
	}
}

export class ComlinkWorkerFS extends OverlayFS implements IFilesStorage {
	async write(path: string, buffer: ArrayBuffer) {
		await this.storage.write(path, transfer(buffer, [buffer]));
	}
}
