import { ipcRenderer } from 'electron';

import { IEncryptionController } from '../../../core/encryption';
import { FilesStorageController } from '../../../core/Registry/FilesRegistry';

import { CHANNELS } from '.';

// TODO: ensure both renderer and main handlers match types

export class ElectronFilesController implements FilesStorageController {
	private readonly subdirectory;
	private readonly encryption;
	constructor(subdirectory: string, encryption?: IEncryptionController) {
		this.subdirectory = subdirectory;
		this.encryption = encryption;
	}

	public async write(id: string, buffer: ArrayBuffer) {
		return ipcRenderer.invoke(CHANNELS.uploadFile, {
			id,
			buffer: this.encryption ? await this.encryption.encrypt(buffer) : buffer,
			subdir: this.subdirectory,
		});
	}

	public async get(id: string) {
		return ipcRenderer
			.invoke(CHANNELS.getFile, { id, subdir: this.subdirectory })
			.then((buffer) => {
				// Don't handle empty data
				if (!buffer) return buffer;

				if (!this.encryption) return buffer;
				return this.encryption.decrypt(buffer);
			});
	}

	public async delete(ids: string[]) {
		return ipcRenderer.invoke(CHANNELS.deleteFiles, {
			ids,
			subdir: this.subdirectory,
		});
	}

	public async list() {
		return ipcRenderer.invoke(CHANNELS.listFiles, { subdir: this.subdirectory });
	}
}
