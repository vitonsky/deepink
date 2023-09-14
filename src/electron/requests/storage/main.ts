import { ipcMain } from 'electron';
import { existsSync } from 'fs';
import path from 'path';

import { writeFileAtomic } from '../../../utils/files';
import { getUserDataPath } from '../../utils/files';

import { mkdir, readdir, readFile, rm } from 'fs/promises';
import { CHANNELS } from '.';

const ensureValidFilePath = (filesDir: string, filePath: string) => {
	// Verify file path
	const isPathOutOfFilesDir = path.dirname(filePath) !== path.resolve(filesDir);
	if (isPathOutOfFilesDir) {
		throw new Error('Invalid path, out of files directory');
	}
};

function uploadFile() {
	ipcMain.handle(CHANNELS.uploadFile, async (_evt, { id, buffer }) => {
		const filesDir = getUserDataPath('files');
		await mkdir(filesDir, { recursive: true });

		const filePath = path.resolve(path.join(filesDir, id));
		ensureValidFilePath(filesDir, filePath);

		await writeFileAtomic(filePath, Buffer.from(buffer as ArrayBuffer));
	});
}

function getFile() {
	ipcMain.handle(CHANNELS.getFile, async (_evt, { id }) => {
		const filesDir = getUserDataPath('files');
		const filePath = path.join(filesDir, id);

		ensureValidFilePath(filesDir, filePath);

		if (!existsSync(filePath)) return null;

		const buffer = await readFile(filePath);
		return buffer.buffer;
	});
}

function deleteFiles() {
	ipcMain.handle(CHANNELS.deleteFiles, async (_evt, { ids }) => {
		const filesDir = getUserDataPath('files');

		for (const id of ids) {
			const filePath = path.join(filesDir, id);

			if (!existsSync(filePath)) {
				console.debug('Not found file', filePath);
				continue;
			}

			await rm(filePath);
			console.debug('Removed file', filePath);
		}
	});
}

function listFiles() {
	ipcMain.handle(CHANNELS.listFiles, async () => {
		const filesDir = getUserDataPath('files');

		const filenames = await readdir(filesDir, {});
		return filenames;
	});
}

export const handleStorageRequests = [
	uploadFile,
	getFile,
	deleteFiles,
	listFiles,
] as const;
