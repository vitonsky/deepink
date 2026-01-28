import { contextBridge, ipcRenderer, webFrame } from 'electron';
import { exposeElectronPatches } from '@electron/requests/electronPatches/preload';
import { initZoomFactor } from '@utils/os/zoom';

initZoomFactor();
exposeElectronPatches();

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		invoke: ipcRenderer.invoke,
	},

	webFrame: {
		getZoomFactor: () => webFrame.getZoomFactor(),
		setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),
	},
});
