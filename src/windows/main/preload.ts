import { contextBridge, ipcRenderer, webFrame } from 'electron';
import { initZoomFactor } from '@utils/os/zoom';

initZoomFactor();

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		invoke: ipcRenderer.invoke,
	},

	webFrame: {
		getZoomFactor: () => webFrame.getZoomFactor(),
		setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),
	},
});

contextBridge.exposeInMainWorld('electronAPI', {
	confirm: (message?: string) => ipcRenderer.sendSync('show-confirm', message),
});
