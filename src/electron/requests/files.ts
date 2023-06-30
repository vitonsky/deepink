import { ipcMain, ipcRenderer } from 'electron';
import { getResourcesPath, getUserDataPath } from '../utils/files';

export const handleFilesRequests = () => {
	ipcMain.handle('getUserDataPath', (_evt, path: string) => {
		return getUserDataPath(path);
	});

	ipcMain.handle('getResourcesPath', (_evt, path: string) => {
		return getResourcesPath(path);
	});
};

export const electronPaths = {
	getUserDataPath(path: string): Promise<string> {
		return ipcRenderer.invoke('getUserDataPath', path);
	},
	getResourcesPath(path: string): Promise<string> {
		return ipcRenderer.invoke('getResourcesPath', path);
	},
} as const;