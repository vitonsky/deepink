import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { FilesController } from '@core/features/files/FilesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../database/SQLiteDatabase/SQLiteDatabase';

import { NotesImporter } from '.';

const FAKE_WORKSPACE_NAME = 'fake-workspace-id';

const createTextBuffer = (text: string): ArrayBuffer => new TextEncoder().encode(text);

const dbFile = createFileControllerMock();
const dbPromise = openDatabase(dbFile);

afterAll(async () => {
	const db = await dbPromise;
	await db.close();
});

describe('Text buffers may be imported', () => {
	const fileManager = createFileManagerMock();

	test('Import notes', async () => {
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

		const importer = new NotesImporter({
			filesRegistry,
			attachmentsRegistry,
			notesRegistry,
			tagsRegistry,
		});

		await importer.import({
			// Resources is a special directory with attachments
			'/_resources/secret.txt': createTextBuffer('SECRET'),
			// This files must not be imported,
			// since it is unused resources
			'/_resources/unused1': createTextBuffer('UNUSED FILE'),
			'/_resources/unused2.txt': createTextBuffer('UNUSED FILE'),
			'/_resources/unused3.md': createTextBuffer('UNUSED FILE'),

			// Notes list
			'/note-1.md': createTextBuffer('Hello world!'),
			'/note-2.md': createTextBuffer(
				'---\ntitle: Title from meta\n---\nHello world!',
			),
			'/note-3.md': createTextBuffer('Mention for [note #1](./note-1.md)'),
			'/note-4.md': createTextBuffer(
				'Text with [attachment](./_resources/secret.txt)',
			),
			'/note-5.md': createTextBuffer(
				'Another text with [attachment](./_resources/secret.txt)',
			),
			// Notes in subdirectories
			'/note-6.md': createTextBuffer(
				'Mention for non exist notes [one](./non-exist-note-1.md), [two](<./non exist note 2.md>), [three](./non/exist/note.md), [four](../../non-exist-note.md). And non exists attachments [one](./non-exist-file-1.jpeg), [two](<./non exist file 2.jpeg>), [three](./non/exist/file.jpeg), [four](../non-exist-file.jpeg)',
			),
			'/note-7.md': createTextBuffer(
				'Mention for [note #1](/note-1.md) via absolute path',
			),
			// Notes in subdirectories
			'/section-1/note #1.md': createTextBuffer('Hello world!'),
			'/section-1/note #2.md': createTextBuffer(
				'Mention for [note #1](<./note #1.md>)',
			),

			// Subdirectories with resources
			'/posts/about/image.png': createTextBuffer('IMAGE CONTENT HERE'),
			'/posts/about/unused.png': createTextBuffer('UNUSED IMAGE CONTENT HERE'),
			'/posts/about/index.md': createTextBuffer(
				'---\ntitle: Blog post\n---\nPost with image\n\n![attached image](./image.png)\nThis post and all its resources is placed in subdirectory.',
			),
		});
	});

	test('Imported notes is in list', async () => {
		const db = await dbPromise;
		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);

		await expect(notesRegistry.get()).resolves.toEqual([
			expect.objectContaining({
				// TODO: fix unnecessary new line
				content: { title: 'note-1', text: 'Hello world!\n' },
			}),
			expect.objectContaining({
				content: { title: 'Title from meta', text: 'Hello world!\n' },
			}),
			expect.objectContaining({
				content: {
					title: 'note-3',
					text: expect.stringMatching(
						/^Mention for \[note #1\]\(note:\/\/[\d\w-]+\)\n$/,
					),
				},
			}),
			expect.objectContaining({
				content: {
					title: 'note-4',
					text: expect.stringMatching(
						/^Text with \[attachment\]\(res:\/\/[\d\w-]+\)\n$/,
					),
				},
			}),
			expect.objectContaining({
				content: {
					title: 'note-5',
					text: expect.stringMatching(
						/^Another text with \[attachment\]\(res:\/\/[\d\w-]+\)\n$/,
					),
				},
			}),
			expect.objectContaining({
				content: {
					title: 'note-6',
					text: 'Mention for non exist notes [one](./non-exist-note-1.md), [two](<./non exist note 2.md>), [three](./non/exist/note.md), [four](../../non-exist-note.md). And non exists attachments [one](./non-exist-file-1.jpeg), [two](<./non exist file 2.jpeg>), [three](./non/exist/file.jpeg), [four](../non-exist-file.jpeg)\n',
				},
			}),

			expect.objectContaining({
				content: {
					title: 'note-7',
					text: expect.stringMatching(
						/^Mention for \[note #1\]\(note:\/\/[\d\w-]+\) via absolute path\n$/,
					),
				},
			}),
			expect.objectContaining({
				// TODO: fix unnecessary new line
				content: { title: 'note #1', text: 'Hello world!\n' },
			}),
			expect.objectContaining({
				content: {
					title: 'note #2',
					text: expect.stringMatching(
						/^Mention for \[note #1\]\(note:\/\/[\d\w-]+\)\n$/,
					),
				},
			}),
			expect.objectContaining({
				content: {
					title: 'Blog post',
					text: expect.stringMatching(
						/^Post with image\n\n!\[attached image\]\(res:\/\/[\d\w-]+\)\nThis post and all its resources is placed in subdirectory.\n$/,
					),
				},
			}),
		]);
	});

	test('Only attached files must be saved on FS', async () => {
		// If file used in many places, it must have many references,
		// but physically we have only one file
		await expect(fileManager.list()).resolves.toHaveLength(2);
	});

	test('Attached files is in files list', async () => {
		const db = await dbPromise;
		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);

		const note = await notesRegistry.get().then((notes) => {
			const note = notes.find((note) => note.content.title === 'note-4');
			if (!note) throw new Error('Not found note by title');

			return note;
		});

		const attachmentsRegistry = new AttachmentsController(db, FAKE_WORKSPACE_NAME);
		const filesRegistry = new FilesController(
			db,
			fileManager,
			attachmentsRegistry,
			FAKE_WORKSPACE_NAME,
		);

		const attachmentIds = await attachmentsRegistry.get(note.id);
		expect(attachmentIds).toHaveLength(1);

		await expect(
			filesRegistry
				.get(attachmentIds[0])
				.then((file) => (file ? file.text() : null)),
		).resolves.toEqual('SECRET');
	});

	test('Tags is created and reproduces structure in FS', async () => {
		const db = await dbPromise;
		const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);

		await expect(tagsRegistry.getTags()).resolves.toEqual([
			expect.objectContaining({
				name: 'section-1',
				parent: null,
				resolvedName: 'section-1',
			}),
			expect.objectContaining({
				name: 'posts',
				parent: null,
				resolvedName: 'posts',
			}),
			expect.objectContaining({
				name: 'about',
				parent: expect.stringMatching(/^[\d\w-]+$/),
				resolvedName: 'posts/about',
			}),
		]);
	});
});
