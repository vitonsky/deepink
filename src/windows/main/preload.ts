import { contextBridge, ipcRenderer, webFrame } from 'electron';
import { confirm } from '@electron/requests/confirm/preload';
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

	confirm,
});
