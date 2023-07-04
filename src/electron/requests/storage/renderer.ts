import { ipcRenderer } from 'electron';

import { CHANNELS } from '.';

export function uploadFile(buffer: ArrayBuffer): Promise<string> {
	return ipcRenderer.invoke(CHANNELS.uploadFile, { buffer });
};

export function getFile(id: string): Promise<ArrayBuffer> {
	return ipcRenderer.invoke(CHANNELS.getFile, { id });
};
