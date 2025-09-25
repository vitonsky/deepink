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

describe('Notes and files may be exported', () => {
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
		const file1Id = await filesRegistry.add(
			createTextFile('Text content of attachment'),
		);
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

	test('Export notes', async () => {
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

		const saveFile = vi.fn();

		const exporter = new NotesExporter({
			saveFile,
			filesRegistry,
			notesRegistry,
			tagsRegistry,
		});

		// TODO: Replace resource URLs like `Note with [attachment](res://[REDACTED-UUID])` to file paths
		// TODO: save notes one by one
		// Exported notes
		await expect(
			exporter.exportNotes().then((notes) =>
				notes.map((note, index) => {
					note.id = '[REDACTED UUID]';
					note.data = note.data
						.replace(/created: \d+/, `created: ${100_000 + index}`)
						.replace(/updated: \d+/, `updated: ${200_000 + index}`)
						.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]');
					return note;
				}),
			),
		).resolves.toMatchSnapshot('Exported notes array');

		// TODO: callback must be called only once per unique file (not to save twice the same file)
		// Callback calls to save files
		expect(saveFile.mock.calls).toEqual([
			[expect.any(File), expect.any(String)],
			[expect.any(File), expect.any(String)],
		]);
	});
});
