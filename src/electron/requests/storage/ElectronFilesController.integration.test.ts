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

const storageHandlerCleanup = enableStorage();
const filesController = new ElectronFilesController(storageApi, 'profileDir');

const getBufferFromText = (text: string) => new Uint8Array(Buffer.from(text)).buffer;

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

test('File may be accessed via absolute and relevant paths both', async () => {
	await expect(filesController.get('test.txt')).resolves.toStrictEqual(
		getBufferFromText('File text content'),
	);
	await expect(filesController.get('/test.txt')).resolves.toStrictEqual(
		getBufferFromText('File text content'),
	);
	await expect(filesController.get('////test.txt')).resolves.toStrictEqual(
		getBufferFromText('File text content'),
	);
	await expect(filesController.get('/foo/../test.txt')).resolves.toStrictEqual(
		getBufferFromText('File text content'),
	);

	await expect(filesController.get('/foo/bar/baz/test.txt')).resolves.toStrictEqual(
		getBufferFromText('File text content'),
	);
	await expect(filesController.get('./foo/bar/baz/test.txt')).resolves.toStrictEqual(
		getBufferFromText('File text content'),
	);
	await expect(filesController.get('foo/bar/baz/test.txt')).resolves.toStrictEqual(
		getBufferFromText('File text content'),
	);
});

describe('Deletion tests', () => {
	const files = new ElectronFilesController(storageApi, 'deletionTests');

	test('Add files', async () => {
		await expect(files.write('/root.bytes', new Uint8Array())).resolves.not.toThrow();
		await expect(files.write('/bytes1', new Uint8Array())).resolves.not.toThrow();
		await expect(files.write('/bytes2', new Uint8Array())).resolves.not.toThrow();
		await expect(files.write('/bytes3', new Uint8Array())).resolves.not.toThrow();
		await expect(files.write('/foo/bytes1', new Uint8Array())).resolves.not.toThrow();
		await expect(files.write('/foo/bytes2', new Uint8Array())).resolves.not.toThrow();
		await expect(
			files.write('/foo/bar/bytes1', new Uint8Array()),
		).resolves.not.toThrow();
		await expect(
			files.write('/foo/bar/bytes2', new Uint8Array()),
		).resolves.not.toThrow();
	});

	test('Single file may be deleted', async () => {
		await expect(files.list()).resolves.toContain('/bytes1');
		await files.delete(['bytes1']);
		await expect(files.list()).resolves.not.toContain('/bytes1');
	});

	test('Few files may be deleted', async () => {
		await expect(files.list()).resolves.toContain('/bytes2');
		await expect(files.list()).resolves.toContain('/bytes3');

		await files.delete(['bytes2', '/bytes3']);

		await expect(files.list()).resolves.not.toContain('/bytes2');
		await expect(files.list()).resolves.not.toContain('/bytes3');
	});

	test('Directory deletion deletes all its content', async () => {
		await expect(files.list()).resolves.toContain('/foo/bar/bytes1');
		await expect(files.list()).resolves.toContain('/foo/bar/bytes2');

		await files.delete(['/foo/bar']);
		await expect(files.list()).resolves.not.toContain('/foo/bar/bytes1');
		await expect(files.list()).resolves.not.toContain('/foo/bar/bytes2');
	});

	test('Root directory may be deleted', async () => {
		await expect(files.list()).resolves.not.toEqual([]);

		await files.delete(['/']);
		await expect(files.list()).resolves.toEqual([]);
	});
});

describe('Many clients', () => {
	const files1 = new ElectronFilesController(storageApi, 'profile1');
	const files2 = new ElectronFilesController(storageApi, 'profile2');

	test('Available files is scoped by client root', async () => {
		await files1.write('test.bytes', new Uint8Array(1));

		await expect(files1.list()).resolves.toEqual(['/test.bytes']);
		await expect(files2.list()).resolves.toEqual([]);

		await files2.write('test.bytes', new Uint8Array(2));

		await expect(files1.get('test.bytes')).resolves.toStrictEqual(
			new Uint8Array(1).buffer,
		);
		await expect(files2.get('test.bytes')).resolves.toStrictEqual(
			new Uint8Array(2).buffer,
		);
	});

	test("Client can't traverse out of it's root", async () => {
		await expect(files1.get('../profile2/test.bytes')).rejects.toThrowError(
			'Resolved path is out of root directory',
		);
	});
});

test('Path traversal out of scope directory must not be possible', async () => {
	await expect(filesController.get('/')).resolves.toBeNull();

	// Just to ensure we can read available files
	vol.writeFileSync('/home/userData/appDir/profileDir/secret.txt', 'Secret data');
	await expect(filesController.get('./secret.txt')).resolves.toBeInstanceOf(
		ArrayBuffer,
	);

	// Read file out of scoped directory
	// Scope is defined by a client
	vol.writeFileSync('/home/userData/appDir/secret.txt', 'Secret data');
	await expect(filesController.get('../secret.txt')).rejects.toThrowError(
		'Resolved path is out of root directory',
	);

	// Read file out of root directory
	vol.writeFileSync('/home/userData/secret.txt', 'Secret data');
	await expect(filesController.get('../../secret.txt')).rejects.toThrowError(
		'Resolved path is out of root directory',
	);
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
