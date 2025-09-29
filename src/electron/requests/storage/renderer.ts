import { IEncryptionController } from '@core/encryption';
import { IFilesStorage } from '@core/features/files';

import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { storageChannel, StorageChannelAPI } from '.';

export const storageApi = storageChannel.client(ipcRendererFetcher);

// TODO: transparently resolve all file names like it is absolute paths
export class ElectronFilesController implements IFilesStorage {
	constructor(
		private readonly storageApi: StorageChannelAPI,
		private readonly subdirectory: string,
		private readonly encryption?: IEncryptionController,
	) {
		this.subdirectory = subdirectory;
		this.encryption = encryption;
	}

	public async write(id: string, buffer: ArrayBuffer) {
		const encryptedBuffer = this.encryption
			? await this.encryption.encrypt(buffer)
			: buffer;
		return this.storageApi.upload(id, encryptedBuffer, this.subdirectory);
	}

	public async get(id: string) {
		return this.storageApi.get(id, this.subdirectory).then((buffer) => {
			// Don't handle empty data
			if (!buffer) return buffer;

			if (!this.encryption) return buffer;
			return this.encryption.decrypt(buffer);
		});
	}

	public async delete(ids: string[]) {
		return this.storageApi.delete(ids, this.subdirectory);
	}

	public async list() {
		return this.storageApi.list(this.subdirectory);
	}
}
