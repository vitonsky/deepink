import { ipcMain } from 'electron';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

import { writeFileAtomic } from '../../../utils/files';
import { getUserDataPath } from '../../utils/files';

import { mkdir, readFile } from 'fs/promises';
import { CHANNELS } from '.';

function uploadFile() {
	ipcMain.handle(CHANNELS.uploadFile, async (_evt, { buffer }) => {
		const filesDir = getUserDataPath('files');
		await mkdir(filesDir, { recursive: true });

		let id: string;
		let filePath: string;

		// Find unique filename
		while (true) {
			id = uuid();
			filePath = path.join(filesDir, id);
			if (!existsSync(filePath)) break;
		}

		await writeFileAtomic(filePath, Buffer.from(buffer as ArrayBuffer));

		return id;
	});
};

function getFile() {
	ipcMain.handle(CHANNELS.getFile, async (_evt, { id }) => {
		const filesDir = getUserDataPath('files');
		const filePath = path.join(filesDir, id);

		if (!existsSync(filePath)) return null;

		const buffer = await readFile(filePath);
		return buffer.buffer;
	});
};

export const handleStorageRequests = [uploadFile, getFile] as const;