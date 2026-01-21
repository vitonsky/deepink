import { contextBridge, ipcRenderer, webFrame } from 'electron';

webFrame.setZoomFactor(1);

const dpr = window.devicePixelRatio;

console.log('Device pixel ratio', dpr);
webFrame.setZoomFactor(dpr);

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		invoke: ipcRenderer.invoke,
	},
});
