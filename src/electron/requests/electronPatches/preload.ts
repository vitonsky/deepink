import { contextBridge, ipcRenderer, webFrame } from 'electron';

import { IpcRendererProxy } from './IpcRendererProxy';
import { CONFIRM_CHANNEL, ELECTRON_PATCHES_API, ElectronPatches } from './shared';

export const exposeElectronPatches = () => {
	// Extended API for a renderer process
	const ipcRendererProxy = new IpcRendererProxy(ipcRenderer);
	contextBridge.exposeInMainWorld(ELECTRON_PATCHES_API, {
		confirm: (message?: string) => ipcRenderer.sendSync(CONFIRM_CHANNEL, message),
		ipcRendererProxy: {
			on(channel, listener) {
				return ipcRendererProxy.on(channel, listener);
			},
			off(channel, listenerId) {
				return ipcRendererProxy.off(channel, listenerId);
			},
		},
	} satisfies ElectronPatches);

	// Exposed electron API
	contextBridge.exposeInMainWorld('electron', {
		ipcRenderer: {
			invoke(channel: string, ...args: any[]) {
				return ipcRenderer.invoke(channel, ...args);
			},
		} satisfies Partial<Electron.IpcRenderer>,

		webFrame: {
			getZoomFactor: () => webFrame.getZoomFactor(),
			setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),
		},
	});
};
