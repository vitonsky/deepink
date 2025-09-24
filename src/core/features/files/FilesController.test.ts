// @vitest-environment jsdom

import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { AttachmentsController } from '../attachments/AttachmentsController';
import { createFileManagerMock } from './__tests__/mocks/createFileManagerMock';
import { createTextFile } from './__tests__/mocks/createTextFile';
import { FilesController } from './FilesController';

const testFiles = Array(5)
	.fill(null)
	.map((_, idx) => createTextFile(`Demo text #${idx + 1}`));

test('clear orphaned files', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);
	const fileManager = createFileManagerMock();
	const attachments = new AttachmentsController(db, 'fake-workspace-id');
	const files = new FilesController(db, fileManager, attachments, 'fake-workspace-id');

	// Upload file and attach
	const fileToAttach = createTextFile('Attached file');
	const attachedFileId = await files.add(fileToAttach);
	await attachments.set('some-note-id', [attachedFileId]);

	// Upload files with no attach
	const filesId = await Promise.all(testFiles.map((file) => files.add(file)));

	// Test files content are expected
	await Promise.all(
		filesId.map(async (fileId, index) => {
			const file = await files.get(fileId);
			expect(file).not.toBeNull();

			const fileBuffer = await (file as File).arrayBuffer();
			const originalFileBuffer = await testFiles[index].arrayBuffer();

			const fileString = Buffer.from(fileBuffer).toString('utf-8');
			const originalString = Buffer.from(originalFileBuffer).toString('utf-8');
			expect(fileString).toBe(originalString);
		}),
	);

	// Check files before cleanup
	await files.get(attachedFileId).then((file) => {
		expect(file).not.toBeNull();
	});
	await files.get(filesId[0]).then((file) => {
		expect(file).not.toBeNull();
	});

	// Clear files and check again
	await files.clearOrphaned();
	await files.get(attachedFileId).then((file) => {
		expect(file).not.toBeNull();
	});
	await files.get(filesId[0]).then((file) => {
		expect(file).toBeNull();
	});

	// File is not orphaned when any resource use it
	await attachments.set('some-note-id', []);
	await attachments.set('some-note-id2', [attachedFileId]);
	await files.clearOrphaned();
	await files.get(attachedFileId).then((file) => {
		expect(file).not.toBeNull();
	});

	// File orphaned when nothing to refer on file
	await attachments.set('some-note-id2', []);
	await files.clearOrphaned();
	await files.get(attachedFileId).then((file) => {
		expect(file).toBeNull();
	});

	await db.close();
});
