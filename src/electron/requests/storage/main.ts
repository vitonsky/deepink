import { IpcMainInvokeEvent } from 'electron';
import { existsSync, statSync } from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';
import { ApiToHandlers } from '@electron/utils/ipc';
import { recoveryAtomicFile, writeFileAtomic } from '@utils/files';

import { getUserDataPath, joinPath } from '../../utils/files';
import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { mkdir, readFile, rm } from 'fs/promises';
import { storageChannel, StorageChannelAPI } from '.';

export const createStorageBackend = () => {
	const getScopedPath = (subdir: string | undefined, path?: string) =>
		path ? joinPath(getUserDataPath(subdir), path) : getUserDataPath(subdir);

	return {
		async upload({ req: [id, buffer, subdir] }) {
			const filePath = getScopedPath(subdir, id);
			await mkdir(path.dirname(filePath), { recursive: true });
			await writeFileAtomic(filePath, Buffer.from(new Uint8Array(buffer)));
		},

		async get({ req: [id, subdir] }) {
			const filePath = getScopedPath(subdir, id);

			recoveryAtomicFile(filePath);

			if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;

			const buffer = await readFile(filePath);
			return new Uint8Array(buffer).buffer;
		},

		async delete({ req: [ids, subdir] }) {
			for (const id of ids) {
				const filePath = getScopedPath(subdir, id);

				if (!existsSync(filePath)) {
					console.debug('Not found file', filePath);
					continue;
				}

				await rm(filePath, { force: true, recursive: true });
				console.debug('Removed file', filePath);
			}
		},

		async list({ req: [subdir] }) {
			const filesDir = getScopedPath(subdir);

			if (!existsSync(filesDir)) return [];

			const files = await recursive(filesDir);
			return files.map((path) =>
				// Remove root path
				path.slice(filesDir.length),
			);
		},
	} satisfies ApiToHandlers<StorageChannelAPI, IpcMainInvokeEvent>;
};

export const enableStorage = () =>
	storageChannel.server(ipcMainHandler, createStorageBackend());
