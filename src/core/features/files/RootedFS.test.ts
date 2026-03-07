// src/core/features/files/RootedFS.nested.test.ts

import { InMemoryFS } from './InMemoryFS';
import { RootedFS } from './RootedFS';

describe('Nested rooting', () => {
	test('Trivial nesting', async () => {
		const underlying = new InMemoryFS();

		await underlying.write('/workspaces/abc/files/img.png', new ArrayBuffer(100));
		await expect(underlying.list()).resolves.toEqual([
			'/workspaces/abc/files/img.png',
		]);

		// Rooted via root
		const vaultStorage = new RootedFS(underlying, '/');

		// Rooted via nested dir
		const workspaceFS = new RootedFS(vaultStorage, '/workspaces/abc/files');

		// List a rooted FS
		await expect(workspaceFS.list()).resolves.toEqual(['/img.png']);

		// Write to a rooted FS
		await expect(
			workspaceFS.write('test.txt', new ArrayBuffer(100)),
		).resolves.not.toThrow();
		await expect(underlying.list()).resolves.toEqual([
			'/workspaces/abc/files/img.png',
			'/workspaces/abc/files/test.txt',
		]);

		await expect(
			workspaceFS.write('foo/bar/test.txt', new ArrayBuffer(100)),
		).resolves.not.toThrow();
		await expect(underlying.list()).resolves.toEqual([
			'/workspaces/abc/files/img.png',
			'/workspaces/abc/files/test.txt',
			'/workspaces/abc/files/foo/bar/test.txt',
		]);

		// List an updated rooted FS
		await expect(workspaceFS.list()).resolves.toEqual([
			'/img.png',
			'/test.txt',
			'/foo/bar/test.txt',
		]);
	});

	test('Deep nesting', async () => {
		const underlying = new InMemoryFS();

		await underlying.write('/workspaces/abc/files/img.png', new ArrayBuffer(100));
		await expect(underlying.list()).resolves.toEqual([
			'/workspaces/abc/files/img.png',
		]);

		const vaultStorage = new RootedFS(underlying, '/');
		const workspaces = new RootedFS(vaultStorage, '/workspaces');
		const workspaceAbc = new RootedFS(workspaces, '/abc');
		const workspaceAbcFiles = new RootedFS(workspaceAbc, '/files');

		// List a rooted FS
		await expect(workspaceAbcFiles.list()).resolves.toEqual(['/img.png']);

		// Write to a rooted FS
		await expect(
			workspaceAbcFiles.write('test.txt', new ArrayBuffer(100)),
		).resolves.not.toThrow();
		await expect(underlying.list()).resolves.toEqual([
			'/workspaces/abc/files/img.png',
			'/workspaces/abc/files/test.txt',
		]);

		await expect(
			workspaceAbcFiles.write('foo/bar/test.txt', new ArrayBuffer(100)),
		).resolves.not.toThrow();
		await expect(underlying.list()).resolves.toEqual([
			'/workspaces/abc/files/img.png',
			'/workspaces/abc/files/test.txt',
			'/workspaces/abc/files/foo/bar/test.txt',
		]);

		// List an updated rooted FS
		await expect(workspaceAbcFiles.list()).resolves.toEqual([
			'/img.png',
			'/test.txt',
			'/foo/bar/test.txt',
		]);
	});
});
