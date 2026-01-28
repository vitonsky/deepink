import { contextBridge, ipcRenderer } from 'electron';

import { CONFIRM_CHANNEL, ELECTRON_PATCHES_API } from './shared';

export const exposeElectronPatches = () => {
	contextBridge.exposeInMainWorld(ELECTRON_PATCHES_API, {
		confirm: (message?: string) => ipcRenderer.sendSync(CONFIRM_CHANNEL, message),
	});
};
