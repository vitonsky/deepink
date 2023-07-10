/** @jest-environment jsdom */
import { tmpdir } from 'os';
import path from 'path';
import { tmpNameSync } from 'tmp';

import { getDb } from '../../storage/SQLiteDb';

import { Attachments } from '../Attachments/Attachments';
import { FilesRegistry } from './FilesRegistry';
import { FilesStorageController } from '.';

const File = require('blob-polyfill').File;

globalThis.File = File;

// TODO: move extensions to dir with DB
const dbExtensionsDir = path.join(__dirname, '../../../../sqlite/extensions');

const createFileManagerMock = (): FilesStorageController => {
	const storage: Record<string, ArrayBuffer> = {};
	return {
		async write(uuid, buffer) {
			storage[uuid] = buffer;
		},
		async get(uuid) {
			return storage[uuid];
		},
		async delete(uuids) {
			uuids.forEach((uuid) => {
				delete storage[uuid];
			});
		},
		async list() {
			return Object.keys(storage);
		},
	};
};

const createTextFile = (text: string): File => new File([Buffer.from(text).buffer], 'test.txt', { type: 'text/txt' });

const testFiles = Array(5).fill(null).map((_, idx) => createTextFile(`Demo text #${idx + 1}`));

test('clear orphaned files', async () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });
	const db = await getDb({ dbPath, dbExtensionsDir });
	const fileManager = createFileManagerMock();
	const attachments = new Attachments(db);
	const files = new FilesRegistry(db, fileManager, attachments);

	// Upload file and attach
	const fileToAttach = createTextFile('Attached file');
	const attachedFileId = await files.add(fileToAttach);
	await attachments.set('some-note-id', [attachedFileId]);

	// Upload files with no attach
	const filesId = await Promise.all(testFiles.map((file) => files.add(file)));

	// Test files content are expected
	await Promise.all(filesId.map(async (fileId, index) => {
		const file = await files.get(fileId);
		expect(file).not.toBeNull();

		const fileBuffer = await (file as File).arrayBuffer();
		const originalFileBuffer = await testFiles[index].arrayBuffer();

		const fileString = Buffer.from(fileBuffer).toString('utf-8');
		const originalString = Buffer.from(originalFileBuffer).toString('utf-8');
		expect(fileString).toBe(originalString);
	}));

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