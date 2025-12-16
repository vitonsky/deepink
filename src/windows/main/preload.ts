import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		invoke: ipcRenderer.invoke,
	},
});

contextBridge.exposeInMainWorld('electronAPI', {
	confirm: (message?: string) => ipcRenderer.sendSync('show-confirm', message),
});
