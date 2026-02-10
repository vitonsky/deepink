import { contextBridge, ipcRenderer, webFrame } from 'electron';
import { exposeElectronPatches } from '@electron/requests/electronPatches/preload';
import { initZoomFactor } from '@utils/os/zoom';

initZoomFactor();
exposeElectronPatches();

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		invoke(channel: string, ...args: any[]) {
			return ipcRenderer.invoke(channel, ...args);
		},
		on(channel, listener) {
			return ipcRenderer.on(channel, listener);
		},
		off(channel, listener) {
			return ipcRenderer.off(channel, listener);
		},
	} satisfies Partial<Electron.IpcRenderer>,

	webFrame: {
		getZoomFactor: () => webFrame.getZoomFactor(),
		setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),
	},
});
