import { existsSync } from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';
import { recoveryAtomicFile, writeFileAtomic } from '@utils/files';

import { getUserDataPath } from '../../utils/files';
import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { mkdir, readFile, rm } from 'fs/promises';
import { storageChannel } from '.';

export const enableStorage = () =>
	storageChannel.server(ipcMainHandler, {
		async upload({ req: [id, buffer, subdir] }) {
			const filePath = getUserDataPath(subdir, id);
			await mkdir(path.dirname(filePath), { recursive: true });
			await writeFileAtomic(filePath, Buffer.from(buffer));
		},

		async get({ req: [id, subdir] }) {
			const filePath = getUserDataPath(subdir, id);

			recoveryAtomicFile(filePath);

			if (!existsSync(filePath)) return null;

			const buffer = await readFile(filePath);
			return buffer.buffer;
		},

		async delete({ req: [ids, subdir] }) {
			for (const id of ids) {
				const filePath = getUserDataPath(subdir, id);

				if (!existsSync(filePath)) {
					console.debug('Not found file', filePath);
					continue;
				}

				await rm(filePath, { force: true, recursive: true });
				console.debug('Removed file', filePath);
			}
		},

		async list({ req: [subdir] }) {
			const filesDir = getUserDataPath(subdir);

			if (!existsSync(filesDir)) return [];

			const files = await recursive(filesDir);
			return files.map((path) =>
				// Remove root path + slash
				path.slice(filesDir.length + 1),
			);
		},
	});
