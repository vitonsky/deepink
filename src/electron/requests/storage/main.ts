import { existsSync } from 'fs';
import path from 'path';

import { writeFileAtomic } from '../../../utils/files';
import { getUserDataPath } from '../../utils/files';
import { ipcMainHandler } from '../../utils/ipc/electronMain';

import { mkdir, readdir, readFile, rm } from 'fs/promises';
import { storageChannel } from ".";

const ensureValidFilePath = (filesDir: string, filePath: string) => {
	// Verify file path
	const isPathOutOfFilesDir = path.dirname(filePath) !== path.resolve(filesDir);
	if (isPathOutOfFilesDir) {
		throw new Error('Invalid path, out of files directory');
	}
};

const getFilesDirPath = (subDirectory?: string) =>
	subDirectory ? path.join(subDirectory, 'files') : 'files';

export const enableStorage = () =>
	storageChannel.server(ipcMainHandler, {
		async upload({ req: [id, buffer, subdir] }) {
			const filesDir = getUserDataPath(getFilesDirPath(subdir));
			await mkdir(filesDir, { recursive: true });

			const filePath = path.resolve(path.join(filesDir, id));
			ensureValidFilePath(filesDir, filePath);

			await writeFileAtomic(filePath, Buffer.from(buffer as ArrayBuffer));
		},
		async get({ req: [id, subdir] }) {
			const filesDir = getUserDataPath(getFilesDirPath(subdir));
			await mkdir(filesDir, { recursive: true });

			const filePath = path.join(filesDir, id);

			ensureValidFilePath(filesDir, filePath);

			if (!existsSync(filePath)) return null;

			const buffer = await readFile(filePath);
			return buffer.buffer;
		},

		async delete({ req: [ids, subdir] }) {
			const filesDir = getUserDataPath(getFilesDirPath(subdir));
			await mkdir(filesDir, { recursive: true });

			for (const id of ids) {
				const filePath = path.join(filesDir, id);

				if (!existsSync(filePath)) {
					console.debug('Not found file', filePath);
					continue;
				}

				await rm(filePath);
				console.debug('Removed file', filePath);
			}
		},

		async list({ req: [subdir] }) {
			const filesDir = getUserDataPath(getFilesDirPath(subdir));
			await mkdir(filesDir, { recursive: true });

			const filenames = await readdir(filesDir, {});
			return filenames;
		},
	});
