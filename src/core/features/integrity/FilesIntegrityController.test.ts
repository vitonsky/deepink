// @vitest-environment jsdom

import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { AttachmentsController } from '../attachments/AttachmentsController';
import { createFileManagerMock } from '../files/__tests__/mocks/createFileManagerMock';
import { createTextFile } from '../files/__tests__/mocks/createTextFile';
import { FilesController } from '../files/FilesController';
import { FilesIntegrityController } from './FilesIntegrityController';

const FAKE_WORKSPACE_ID = getUUID();

const testFiles = Array(5)
	.fill(null)
	.map((_, idx) => createTextFile(`Demo text #${idx + 1}`));

test('Clear orphaned files', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);

	const fileManager = createFileManagerMock();
	const attachments = new AttachmentsController(db, FAKE_WORKSPACE_ID);
	const files = new FilesController(db, fileManager, FAKE_WORKSPACE_ID);

	const integrityController = new FilesIntegrityController(
		FAKE_WORKSPACE_ID,
		fileManager,
		{
			files,
			attachments,
		},
	);

	const NOTE_1 = getUUID();
	const NOTE_2 = getUUID();

	// Upload file and attach
	const fileToAttach = createTextFile('Attached file');
	const attachedFileId = await files.add(fileToAttach);
	await attachments.set(NOTE_1, [attachedFileId]);

	// Upload files with no attach
	const filesId = await Promise.all(testFiles.map((file) => files.add(file)));

	// Test files content are expected
	await Promise.all(
		filesId.map(async (fileId, index) => {
			const file = await files.get(fileId);
			expect(file).not.toBeNull();

			const fileBuffer = await file!.arrayBuffer();
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
	await integrityController.fixAll();

	await files.get(attachedFileId).then((file) => {
		expect(file).not.toBeNull();
	});
	await files.get(filesId[0]).then((file) => {
		expect(file).toBeNull();
	});

	// File is not orphaned when any resource use it
	await attachments.set(NOTE_1, []);
	await attachments.set(NOTE_2, [attachedFileId]);
	await integrityController.fixAll();
	await files.get(attachedFileId).then((file) => {
		expect(file).not.toBeNull();
	});

	// File orphaned when nothing to refer on file
	await attachments.set(NOTE_2, []);
	await integrityController.fixAll();
	await files.get(attachedFileId).then((file) => {
		expect(file).toBeNull();
	});

	await db.close();
});
