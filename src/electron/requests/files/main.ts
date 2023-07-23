import { ipcMain } from 'electron';

import * as filesUtils from '../../utils/files';

import { CHANNELS } from '.';

function getUserDataPath() {
	ipcMain.handle(CHANNELS.getUserDataPath, (_evt, path: string) => {
		return filesUtils.getUserDataPath(path);
	});
};

function getResourcesPath() {
	ipcMain.handle(CHANNELS.getResourcesPath, (_evt, path: string) => {
		return filesUtils.getResourcesPath(path);
	});
};

function exportNotes() {
	ipcMain.handle(CHANNELS.exportNotes, async () => {
		console.warn('Start export');
	});
};

export const handleFilesRequests = [getUserDataPath, getResourcesPath, exportNotes] as const;