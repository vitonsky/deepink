import { BrowserWindow, dialog, ipcMain } from 'electron';
import { globSync } from 'fast-glob';
import { lstatSync } from 'fs';

import * as filesUtils from '../../utils/files';

import { readFile, realpath } from 'fs/promises';
import { CHANNELS } from '.';

function getUserDataPath() {
	ipcMain.handle(CHANNELS.getUserDataPath, (_evt, path: string) => {
		return filesUtils.getUserDataPath(path);
	});
}

function getResourcesPath() {
	ipcMain.handle(CHANNELS.getResourcesPath, (_evt, path: string) => {
		return filesUtils.getResourcesPath(path);
	});
}

function selectDirectory() {
	ipcMain.handle(CHANNELS.selectDirectory, async (evt) => {
		const window = BrowserWindow.getAllWindows().find(
			(win) => win.webContents.id === evt.sender.id,
		);
		if (!window) return null;

		const { filePaths } = await dialog.showOpenDialog(window, {
			properties: ['openDirectory'],
		});

		return filePaths;
	});
}

function exportNotes() {
	ipcMain.handle(CHANNELS.importNotes, async (evt) => {
		const window = BrowserWindow.getAllWindows().find(
			(win) => win.webContents.id === evt.sender.id,
		);
		if (!window) return;

		console.warn('Start export');
		const { filePaths } = await dialog.showOpenDialog(window, {
			properties: ['openDirectory'],
		});
		if (filePaths.length === 0) return;

		const directoryToScan = filePaths[0];
		const files = globSync(`${directoryToScan}/{*,**/*}`);

		const rootDir = await realpath(directoryToScan);
		const filesMap: Record<string, ArrayBuffer> = {};
		await Promise.all(
			files.map(async (file) => {
				const absoluteFilename = await realpath(file);
				if (!absoluteFilename.startsWith(rootDir)) return;
				if (!lstatSync(file).isFile()) return;

				const rootPathLengthWithSlash = rootDir.length + 1;
				const filename = absoluteFilename.slice(rootPathLengthWithSlash);
				const buffer = await readFile(file);
				filesMap[filename] = buffer.buffer;
			}),
		);

		return filesMap;
	});
}

export const handleFilesRequests = [
	selectDirectory,
	getUserDataPath,
	getResourcesPath,
	exportNotes,
] as const;
