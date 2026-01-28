import { contextBridge, ipcRenderer, webFrame } from 'electron';
import { exposeConfirm } from '@electron/requests/confirm/preload';
import { initZoomFactor } from '@utils/os/zoom';

initZoomFactor();
exposeConfirm();

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		invoke: ipcRenderer.invoke,
	},

	webFrame: {
		getZoomFactor: () => webFrame.getZoomFactor(),
		setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),
	},
});
