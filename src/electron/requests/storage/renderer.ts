import { ipcRenderer } from 'electron';

import { CHANNELS } from '.';

// TODO: ensure both renderer and main handlers match types

export function uploadFile(id: string, buffer: ArrayBuffer): Promise<void> {
	return ipcRenderer.invoke(CHANNELS.uploadFile, { id, buffer });
};

export function getFile(id: string): Promise<ArrayBuffer | null> {
	return ipcRenderer.invoke(CHANNELS.getFile, { id });
};
