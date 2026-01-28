import { ipcRenderer } from 'electron';

export const confirm = (message?: string) =>
	ipcRenderer.sendSync('show-confirm', message);
