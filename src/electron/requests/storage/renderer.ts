import { ipcRenderer } from 'electron';

import { FilesStorageController } from '../../../core/Registry/FilesRegistry';

import { CHANNELS } from '.';

// TODO: ensure both renderer and main handlers match types

export class ElectronFilesController implements FilesStorageController {
	private readonly subdirectory;
	constructor(subdirectory: string) {
		this.subdirectory = subdirectory;
	}

	public async write(id: string, buffer: ArrayBuffer) {
		return ipcRenderer.invoke(CHANNELS.uploadFile, {
			id,
			buffer,
			subdir: this.subdirectory,
		});
	}

	public async get(id: string) {
		return ipcRenderer.invoke(CHANNELS.getFile, { id, subdir: this.subdirectory });
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
