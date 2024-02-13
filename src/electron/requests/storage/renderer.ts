import { ipcRenderer } from 'electron';

import { IEncryptionController } from '../../../core/encryption';
import { IFilesStorage } from '../../../core/features/files';

import { storageChannel } from ".";

export const storageApi = storageChannel.client({
	async upload({ channelName, args }) {
		return ipcRenderer.invoke(channelName, args);
	},
	async get({ channelName, args }) {
		return ipcRenderer.invoke(channelName, args);
	},
	async delete({ channelName, args }) {
		return ipcRenderer.invoke(channelName, args);
	},
	async list({ channelName, args }) {
		return ipcRenderer.invoke(channelName, args);
	},
});

export class ElectronFilesController implements IFilesStorage {
	private readonly subdirectory;
	private readonly encryption;
	constructor(subdirectory: string, encryption?: IEncryptionController) {
		this.subdirectory = subdirectory;
		this.encryption = encryption;
	}

	public async write(id: string, buffer: ArrayBuffer) {
		const encryptedBuffer = this.encryption
			? await this.encryption.encrypt(buffer)
			: buffer;
		return storageApi.upload(id, encryptedBuffer, this.subdirectory);
	}

	public async get(id: string) {
		return storageApi.get(id, this.subdirectory).then((buffer) => {
			// Don't handle empty data
			if (!buffer) return buffer;

			if (!this.encryption) return buffer;
			return this.encryption.decrypt(buffer);
		});
	}

	public async delete(ids: string[]) {
		return storageApi.delete(ids, this.subdirectory);
	}

	public async list() {
		return storageApi.list(this.subdirectory);
	}
}
