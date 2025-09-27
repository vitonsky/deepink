// @vitest-environment jsdom

import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { createTextFile } from '@core/features/files/__tests__/mocks/createTextFile';
import { FilesController } from '@core/features/files/FilesController';
import { formatNoteLink, formatResourceLink } from '@core/features/links';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../database/SQLiteDatabase/SQLiteDatabase';

import { NotesExporter } from '.';

const FAKE_WORKSPACE_NAME = 'fake-workspace-id';

const dbFile = createFileControllerMock();
const dbPromise = openDatabase(dbFile);

afterAll(async () => {
	const db = await dbPromise;
	await db.close();
});

const fileManager = createFileManagerMock();

test('Create notes', async () => {
	const db = await dbPromise;
	const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
	const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);

	const attachmentsRegistry = new AttachmentsController(db, FAKE_WORKSPACE_NAME);
	const filesRegistry = new FilesController(
		db,
		fileManager,
		attachmentsRegistry,
		FAKE_WORKSPACE_NAME,
	);

	// Upload files
	const file1Id = await filesRegistry.add(createTextFile('Text content of attachment'));
	await Promise.all(
		Array(10)
			.fill(null)
			.map(() => filesRegistry.add(createTextFile('UNUSED FILE'))),
	);

	// Create tags
	const tags = await Promise.all([
		tagsRegistry.add('foo', null),
		tagsRegistry.add('bar', null),
		tagsRegistry.add('baz', null),
	]);

	// Add notes
	const note1Id = await notesRegistry.add({
		title: 'Note 1',
		text: 'Hello world!',
	});

	await tagsRegistry.setAttachedTags(note1Id, tags);

	await notesRegistry.add({
		title: 'Note 2',
		text: `Mention for [Note 1](${formatNoteLink(note1Id)})`,
	});

	await attachmentsRegistry.set(
		await notesRegistry.add({
			title: 'Note 3',
			text: `Note with [attachment](${formatResourceLink(file1Id)})`,
		}),
		[file1Id],
	);

	await attachmentsRegistry.set(
		await notesRegistry.add({
			title: 'Note 4',
			text: `Note with [attachment](${formatResourceLink(
				file1Id,
			)}) and mention for [Note 1](${formatNoteLink(note1Id)})`,
		}),
		[file1Id],
	);
	await attachmentsRegistry.set(
		await notesRegistry.add({
			title: 'Note 5',
			text: `Note with [invalid attachment](${formatResourceLink(
				'00000000-0000-0000-0000-000000000000',
			)}) and mention for [invalid note](${formatNoteLink(
				'00000000-0000-0000-0000-000000000000',
			)})`,
		}),
		[file1Id],
	);
});

test('Export all notes and attached files', async () => {
	const db = await dbPromise;
	const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
	const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);

	const attachmentsRegistry = new AttachmentsController(db, FAKE_WORKSPACE_NAME);
	const filesRegistry = new FilesController(
		db,
		fileManager,
		attachmentsRegistry,
		FAKE_WORKSPACE_NAME,
	);

	const exporter = new NotesExporter({
		filesRegistry,
		notesRegistry,
		tagsRegistry,
	});

	// Exported notes
	const exportTarget = createFileManagerMock();
	await expect(exporter.exportNotes(exportTarget)).resolves.not.toThrow();

	const filesList = exportTarget.list();
	await expect(
		filesList.then((paths) =>
			paths.map((path) =>
				path.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]'),
			),
		),
	).resolves.toMatchSnapshot('Files list');

	const notesPaths = await filesList.then((paths) =>
		paths.filter((path) => path.endsWith('.md')),
	);

	await expect(
		Promise.all(
			notesPaths.map(async (path, index) => {
				const content = await exportTarget.get(path);
				if (!content) throw new Error('File not found');

				return new TextDecoder()
					.decode(content)
					.replace(/created: \d+/, `created: ${100_000 + index}`)
					.replace(/updated: \d+/, `updated: ${200_000 + index}`)
					.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]');
			}),
		),
	).resolves.toMatchSnapshot('Notes texts');
});

test('Export single note and it attachments', async () => {
	const db = await dbPromise;
	const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
	const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);

	const attachmentsRegistry = new AttachmentsController(db, FAKE_WORKSPACE_NAME);
	const filesRegistry = new FilesController(
		db,
		fileManager,
		attachmentsRegistry,
		FAKE_WORKSPACE_NAME,
	);

	const exporter = new NotesExporter({
		filesRegistry,
		notesRegistry,
		tagsRegistry,
	});

	// Exported single note
	const note = await notesRegistry
		.get()
		.then((notes) => notes.find((note) => note.content.title === 'Note 4'));
	if (!note) throw new Error('Note not found');

	const exportTarget = createFileManagerMock();
	await expect(exporter.exportNote(note.id, exportTarget)).resolves.not.toThrow();

	const filesList = exportTarget.list();
	await expect(
		filesList.then((paths) =>
			paths.map((path) =>
				path.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]'),
			),
		),
	).resolves.toMatchSnapshot('Files list');

	const notesPaths = await filesList.then((paths) =>
		paths.filter((path) => path.endsWith('.md')),
	);

	await expect(
		Promise.all(
			notesPaths.map(async (path, index) => {
				const content = await exportTarget.get(path);
				if (!content) throw new Error('File not found');

				return new TextDecoder()
					.decode(content)
					.replace(/created: \d+/, `created: ${100_000 + index}`)
					.replace(/updated: \d+/, `updated: ${200_000 + index}`)
					.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]');
			}),
		),
	).resolves.toMatchSnapshot('Notes texts');
});
