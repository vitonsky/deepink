import { IEncryptionController } from '@core/encryption';

import { OverlayFS } from './OverlayFS';
import { IFilesStorage } from '.';

export class EncryptedFS extends OverlayFS implements IFilesStorage {
	constructor(
		protected readonly storage: IFilesStorage,
		private readonly encryption: IEncryptionController,
	) {
		super(storage);
	}

	async write(path: string, buffer: ArrayBuffer) {
		const encryptedBuffer = await this.encryption.encrypt(buffer);
		return this.storage.write(path, encryptedBuffer);
	}

	async get(path: string) {
		const buffer = await this.storage.get(path);
		if (!buffer) return null;

		return this.encryption.decrypt(buffer);
	}
}
