// @vitest-environment jsdom

import { makeAutoClosedDB } from 'src/__tests__/utils/makeAutoClosedDB';
import { getUUID } from 'src/__tests__/utils/uuid';

import { createFileManagerMock } from './__tests__/mocks/createFileManagerMock';
import { FilesController } from './FilesController';

const FAKE_WORKSPACE_ID = getUUID();

const { getDB } = makeAutoClosedDB();
const fileManager = createFileManagerMock();

test('Upload files', async () => {
	const db = await getDB();
	const files = new FilesController(db, fileManager, FAKE_WORKSPACE_ID);

	await files.add(new File(['Hello world'], 'hello.md', { type: 'text/markdown' }));
	await files.add(new File(['foo'], 'foo.txt', { type: 'text/plain' }));
	await files.add(new File(['bar'], 'bar.txt', { type: 'text/plain' }));
	await files.add(new File(['baz'], 'baz.txt', { type: 'text/plain' }));

	await expect(fileManager.list()).resolves.toHaveLength(4);
});

test('Fetch files', async () => {
	const db = await getDB();
	const files = new FilesController(db, fileManager, FAKE_WORKSPACE_ID);

	const filesList = await files.query();
	expect(filesList).toEqual([
		expect.objectContaining({
			mimetype: 'text/markdown',
			name: 'hello.md',
		}),
		expect.objectContaining({
			mimetype: 'text/plain',
			name: 'foo.txt',
		}),
		expect.objectContaining({
			mimetype: 'text/plain',
			name: 'bar.txt',
		}),
		expect.objectContaining({
			mimetype: 'text/plain',
			name: 'baz.txt',
		}),
	]);

	const file = await files.get(filesList[0].id);

	expect(file).toBeInstanceOf(File);
	expect(file).toHaveProperty('name', 'hello.md');
	expect(file).toHaveProperty('type', 'text/markdown');
	expect(file).toHaveProperty('lastModified', expect.any(Number));
	await expect(
		file?.arrayBuffer().then((buffer) => new TextDecoder().decode(buffer)),
	).resolves.toBe('Hello world');
});

test('Delete files', async () => {
	const db = await getDB();
	const files = new FilesController(db, fileManager, FAKE_WORKSPACE_ID);

	const filesList = await files.query();
	expect(filesList).toHaveLength(4);
	await expect(fileManager.list()).resolves.toHaveLength(4);

	await files.delete([filesList[0].id]);
	await expect(files.query()).resolves.toHaveLength(3);
	await expect(fileManager.list()).resolves.toHaveLength(3);
});

test('Fetch for non exists file in FS returns null', async () => {
	const db = await getDB();
	const files = new FilesController(db, fileManager, FAKE_WORKSPACE_ID);

	const filesList = await files.query();

	// Delete files
	const fileIdToDelete = filesList[0].id;
	expect(filesList).toHaveLength(3);
	await fileManager.list().then(async (files) => {
		expect(files).toHaveLength(3);
		expect(files).toContainEqual(expect.stringContaining(fileIdToDelete));

		const filePath = files.find((file) => file.endsWith(fileIdToDelete));
		if (!filePath) throw new Error("Can't find file");

		await fileManager.delete([filePath]);
	});

	// File no more exists in FS
	await fileManager.list().then(async (files) => {
		expect(files).toHaveLength(2);
		expect(files).not.toContainEqual(expect.stringContaining(fileIdToDelete));
	});

	await expect(files.get(fileIdToDelete)).resolves.toBe(null);
});
