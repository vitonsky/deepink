import { ipcMain, ipcRenderer } from 'electron';
import { isDevMode } from '../utils/app';

export const handleAppRequests = () => {
	ipcMain.handle('isDevMode', () => {
		return isDevMode();
	});
};

export const electronApp = {
	isDevMode(): Promise<boolean> {
		return ipcRenderer.invoke('isDevMode');
	},
} as const;