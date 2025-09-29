import type { app } from 'electron';
import memfsNameSpace, { vol } from 'memfs';
import * as electronIPCMock from '@electron/utils/ipc/__tests__/electron';
import { getResolvedPath, joinPathSegments } from '@utils/fs/paths';

import { enableStorage } from './main';
import { ElectronFilesController, storageApi } from './renderer';

// Mock API to prevent writes to a real FS
vi.mock('fs', async () => {
	// importActual so types/impl come from memfs
	const memfs = await vi.importActual('memfs');
	// return the promises API so code that does `import { promises as fs } from 'node:fs/promises'`
	// will receive memfs.fs.promises
	return memfs.fs as typeof memfsNameSpace;
});
vi.mock('fs/promises', async () => {
	const memfs = await vi.importActual('memfs');
	return (memfs as typeof memfsNameSpace).fs.promises;
});

vi.mock('electron', async () => {
	return {
		app: {
			// We run tests against production code
			isPackaged: true,
			getPath: ((name) => {
				switch (name) {
					case 'userData':
						return '/home/userData/appDir';
					default:
						throw new Error(`Not implemented case for "${name}"`);
				}
			}) satisfies (typeof app)['getPath'],
		},
		...electronIPCMock,
	};
});

// Real package uses a system calls, that is not mocked,
// so we mock behaviour of this package
vi.mock('recursive-readdir', async () => {
	return {
		default: async (path: string) => {
			const results = await vol.promises.readdir(path, { recursive: true });
			return (
				results
					.map((foundPath) =>
						joinPathSegments([
							getResolvedPath(path, '/'),
							foundPath as string,
						]),
					)
					// Filter out directories and leave only files
					.filter((path) => {
						// Standard `isDirectory` api implemented incorrect,
						// so we manually implement check for directory
						const isDirectory = vol.statSync(path).mode === 16895;
						return !isDirectory;
					})
			);
		},
	};
});

// TODO: add tests for multiple clients
// TODO: add tests for directory traversal protection. Client must not go out of app root
const storageHandlerCleanup = enableStorage();
const filesController = new ElectronFilesController(storageApi, 'profileDir');

test('Write files', async () => {
	expect(vol.readdirSync('/', { recursive: true })).toEqual([]);

	await filesController.write('test.txt', Buffer.from('File text content'));
	await filesController.write(
		'/foo/bar/baz/test.txt',
		Buffer.from('File text content'),
	);

	expect(vol.readdirSync('/', { recursive: true })).toMatchSnapshot(
		'FS structure after writing',
	);
	await expect(filesController.list()).resolves.toMatchSnapshot(
		'Controller files list after writing',
	);
});

test('Check files content', async () => {
	await expect(
		filesController.list().then((paths) =>
			Promise.all(
				paths.map((path) =>
					filesController.get(path).then((buffer) => {
						if (!buffer) throw new Error('Buffer not found');
						return {
							path,
							content: Buffer.from(buffer).toString(),
						};
					}),
				),
			),
		),
	).resolves.toMatchSnapshot('Files content');
});

test('When storage is disposed, any ops in controller throws error', async () => {
	// Clean handler
	storageHandlerCleanup();
	await expect(filesController.list()).rejects.toThrow(
		'No handler registered for storage.list',
	);
	await expect(filesController.get('/')).rejects.toThrow(
		'No handler registered for storage.get',
	);
	await expect(filesController.write('/', new ArrayBuffer(1))).rejects.toThrow(
		'No handler registered for storage.upload',
	);
	await expect(filesController.delete(['/'])).rejects.toThrow(
		'No handler registered for storage.delete',
	);

	// Setup handler
	const storageHandlerCleanup2 = enableStorage();
	await expect(filesController.list()).resolves.toContainEqual('/test.txt');

	// Clear handler again
	storageHandlerCleanup2();
	await expect(filesController.list()).rejects.toThrow(
		'No handler registered for storage.list',
	);
});
