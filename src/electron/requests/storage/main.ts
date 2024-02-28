import { existsSync } from 'fs';
import path from 'path';
import { recoveryAtomicFile, writeFileAtomic } from '@utils/files';

import { getUserDataPath, joinPath } from '../../utils/files';
import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { mkdir, readdir, readFile, rm } from 'fs/promises';
import { storageChannel } from '.';

export const enableStorage = () =>
	storageChannel.server(ipcMainHandler, {
		async upload({ req: [id, buffer, subdir] }) {
			const filesDir = getUserDataPath(subdir);
			await mkdir(filesDir, { recursive: true });

			const filePath = joinPath(filesDir, id);
			await writeFileAtomic(filePath, Buffer.from(buffer));
		},

		async get({ req: [id, subdir] }) {
			const filePath = getUserDataPath(path.join(subdir, id));

			recoveryAtomicFile(filePath);

			if (!existsSync(filePath)) return null;

			const buffer = await readFile(filePath);
			return buffer.buffer;
		},

		async delete({ req: [ids, subdir] }) {
			for (const id of ids) {
				const filePath = getUserDataPath(path.join(subdir, id));

				if (!existsSync(filePath)) {
					console.debug('Not found file', filePath);
					continue;
				}

				await rm(filePath);
				console.debug('Removed file', filePath);
			}
		},

		async list({ req: [subdir] }) {
			const filesDir = getUserDataPath(subdir);

			if (!existsSync(filesDir)) return [];

			const files = await readdir(filesDir, {});
			return files ?? [];
		},
	});
