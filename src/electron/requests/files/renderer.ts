import { ipcRenderer } from 'electron';

import { CHANNELS } from '.';

export function exportNotes(): Promise<void> {
	return ipcRenderer.invoke(CHANNELS.exportNotes);
};

export function getUserDataPath(path: string): Promise<string> {
	return ipcRenderer.invoke(CHANNELS.getUserDataPath, path);
};
export function getResourcesPath(path: string): Promise<string> {
	return ipcRenderer.invoke(CHANNELS.getResourcesPath, path);
};