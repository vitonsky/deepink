/* eslint-disable spellcheck/spell-checker */
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { IFilesStorage } from '@core/features/files';
import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { FilesController } from '@core/features/files/FilesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { NoteVersions } from '@core/features/notes/history/NoteVersions';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';
import { wait } from '@utils/tests';

import {
	openDatabase,
	SQLiteDatabase,
} from '../../database/SQLiteDatabase/SQLiteDatabase';

import { NotesImporter, OnProcessedPayload } from '.';

// Mock API
globalThis.requestAnimationFrame = (callback) => {
	wait(1).then(() => {
		callback(Date.now());
	});
	return 0;
};

const FAKE_WORKSPACE_NAME = 'fake-workspace-id';

const createAppContextIterator = () => {
	let context = 0;

	return (db: SQLiteDatabase, fileManager: IFilesStorage) => {
		const namespace = FAKE_WORKSPACE_NAME + ++context;

		const notesRegistry = new NotesController(db, namespace);
		const noteVersions = new NoteVersions(db, namespace);
		const tagsRegistry = new TagsController(db, namespace);

		const attachmentsRegistry = new AttachmentsController(db, namespace);
		const filesRegistry = new FilesController(db, fileManager, namespace);

		return {
			filesRegistry,
			notesRegistry,
			noteVersions,
			attachmentsRegistry,
			tagsRegistry,
		};
	};
};

const createTextBuffer = (text: string): ArrayBuffer => new TextEncoder().encode(text);

describe('Base notes import cases', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	const fileManager = createFileManagerMock();

	test('Import notes', async () => {
		const db = await dbPromise;
		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
		const noteVersions = new NoteVersions(db, FAKE_WORKSPACE_NAME);
		const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);

		const attachmentsRegistry = new AttachmentsController(db, FAKE_WORKSPACE_NAME);
		const filesRegistry = new FilesController(db, fileManager, FAKE_WORKSPACE_NAME);

		const importer = new NotesImporter(
			{
				filesRegistry,
				notesRegistry,
				noteVersions,
				attachmentsRegistry,
				tagsRegistry,
			},
			{
				ignorePaths: ['/_resources'],
				noteExtensions: ['.md', '.mdx'],
				convertPathToTag: 'always',
				throttle: requestAnimationFrame,
			},
		);

		const onProcessed = vi.fn();
		await expect(
			importer.import(
				createFileManagerMock({
					// Resources is a special directory with attachments
					'/_resources/secret.txt': createTextBuffer('SECRET'),
					// This files must not be imported,
					// since it is unused resources
					'/_resources/unused1': createTextBuffer('UNUSED FILE'),
					'/_resources/unused2.txt': createTextBuffer('UNUSED FILE'),
					'/_resources/unused3.md': createTextBuffer('UNUSED FILE'),

					// Notes list
					'/note-1.md': createTextBuffer('Hello world!'),
					'/note-2.mdx': createTextBuffer(
						'---\ntitle: Title from meta\ntags:\n - foo\n - bar\n - baz\n---\nHello world!',
					),
					'/note-3.mdx': createTextBuffer('Mention for [note #1](./note-1.md)'),
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
					'/posts/about/unused.png': createTextBuffer(
						'UNUSED IMAGE CONTENT HERE',
					),
					'/posts/about/index.md': createTextBuffer(
						'---\ntitle: Blog post\ntags:\n - foo\n - bar\n---\nPost with image\n\n![attached image](./image.png)\nThis post and all its resources is placed in subdirectory.',
					),
				}),
				{ onProcessed },
			),
		).resolves.not.toThrow();

		expect(onProcessed.mock.calls).toMatchSnapshot('onProcessed hook calls');
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

	test('Every note have snapshot', async () => {
		const db = await dbPromise;
		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
		const noteVersions = new NoteVersions(db, FAKE_WORKSPACE_NAME);

		const notes = await notesRegistry.get();

		await Promise.all(
			notes.map((note) =>
				expect(noteVersions.getList(note.id)).resolves.toHaveLength(1),
			),
		);
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
		const filesRegistry = new FilesController(db, fileManager, FAKE_WORKSPACE_NAME);

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
				name: 'foo',
				parent: null,
				resolvedName: 'foo',
			}),
			expect.objectContaining({
				name: 'bar',
				parent: null,
				resolvedName: 'bar',
			}),
			expect.objectContaining({
				name: 'baz',
				parent: null,
				resolvedName: 'baz',
			}),
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

describe('Import notes with different options', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	const fileManager = createFileManagerMock();
	const createAppContext = createAppContextIterator();

	describe('Convert paths to tag', () => {
		test('always', async () => {
			const db = await dbPromise;
			const appContext = createAppContext(db, fileManager);

			await new NotesImporter(appContext, {
				noteExtensions: ['.md'],
				convertPathToTag: 'always',
			}).import(
				createFileManagerMock({
					'/foo/bar/note.md': createTextBuffer('Hello world!'),
					'/foo1/bar1/note.md': createTextBuffer(
						'---\ntags:\n - another tag\n---\nHello world!',
					),
				}),
			);

			await expect(appContext.tagsRegistry.getTags()).resolves.toEqual([
				expect.objectContaining({
					name: 'another tag',
					parent: null,
					resolvedName: 'another tag',
				}),
				expect.objectContaining({
					name: 'foo',
					parent: null,
					resolvedName: 'foo',
				}),
				expect.objectContaining({
					name: 'bar',
					parent: expect.stringMatching(/^[\d\w-]+$/),
					resolvedName: 'foo/bar',
				}),
				expect.objectContaining({
					name: 'foo1',
					parent: null,
					resolvedName: 'foo1',
				}),
				expect.objectContaining({
					name: 'bar1',
					parent: expect.stringMatching(/^[\d\w-]+$/),
					resolvedName: 'foo1/bar1',
				}),
			]);
		});

		test('fallback', async () => {
			const db = await dbPromise;
			const appContext = createAppContext(db, fileManager);

			await new NotesImporter(appContext, {
				noteExtensions: ['.md'],
				convertPathToTag: 'fallback',
			}).import(
				createFileManagerMock({
					'/foo/bar/note.md': createTextBuffer('Hello world!'),
					'/foo1/bar1/note.md': createTextBuffer(
						'---\ntags:\n - another tag\n---\nHello world!',
					),
				}),
			);

			await expect(appContext.tagsRegistry.getTags()).resolves.toEqual([
				expect.objectContaining({
					name: 'another tag',
					parent: null,
					resolvedName: 'another tag',
				}),
				expect.objectContaining({
					name: 'foo',
					parent: null,
					resolvedName: 'foo',
				}),
				expect.objectContaining({
					name: 'bar',
					parent: expect.stringMatching(/^[\d\w-]+$/),
					resolvedName: 'foo/bar',
				}),
			]);
		});

		test('never', async () => {
			const db = await dbPromise;
			const appContext = createAppContext(db, fileManager);

			await new NotesImporter(appContext, {
				noteExtensions: ['.md'],
				convertPathToTag: 'never',
			}).import(
				createFileManagerMock({
					'/foo/bar/note.md': createTextBuffer('Hello world!'),
				}),
			);

			await expect(appContext.tagsRegistry.getTags()).resolves.toEqual([]);
		});
	});
});

describe('Import interruptions', () => {
	const filesSample = {
		'/_resources/secret.txt': createTextBuffer('SECRET'),

		// Notes list
		'/note-1.md': createTextBuffer('Hello world!'),
		'/note-2.mdx': createTextBuffer(
			'---\ntitle: Title from meta\ntags:\n - foo\n - bar\n - baz\n---\nHello world!',
		),
		'/note-3.mdx': createTextBuffer('Mention for [note #1](./note-1.md)'),
		'/note-4.md': createTextBuffer('Text with [attachment](./_resources/secret.txt)'),
		'/note-5.md': createTextBuffer(
			'Another text with [attachment](./_resources/secret.txt)',
		),
	};

	describe('Importer throw error by call for abort signal', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);

		const fileManager = createFileManagerMock();

		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
		const noteVersions = new NoteVersions(db, FAKE_WORKSPACE_NAME);
		const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);

		const attachmentsRegistry = new AttachmentsController(db, FAKE_WORKSPACE_NAME);
		const filesRegistry = new FilesController(db, fileManager, FAKE_WORKSPACE_NAME);

		const importer = new NotesImporter(
			{
				filesRegistry,
				notesRegistry,
				noteVersions,
				attachmentsRegistry,
				tagsRegistry,
			},
			{
				ignorePaths: ['/_resources'],
				noteExtensions: ['.md', '.mdx'],
				convertPathToTag: 'always',
			},
		);

		test('Throw on parsing stage', async () => {
			const abortController = new AbortController();
			const onProcessed = vi.fn((info: OnProcessedPayload) => {
				if (info.stage === 'parsing' && info.processed === 2) {
					abortController.abort(new Error('Import is cancelled'));
				}
			});

			await expect(
				importer.import(createFileManagerMock(filesSample), {
					abortSignal: abortController.signal,
					onProcessed,
				}),
			).rejects.toThrowError('Import is cancelled');

			expect(onProcessed).toHaveBeenLastCalledWith({
				stage: 'parsing',
				total: expect.any(Number),
				processed: 2,
			});
		});

		test('Throw on uploading stage', async () => {
			const abortController = new AbortController();
			const onProcessed = vi.fn((info: OnProcessedPayload) => {
				if (info.stage === 'uploading' && info.processed === 1) {
					abortController.abort(new Error('Import is cancelled'));
				}
			});

			await expect(
				importer.import(createFileManagerMock(filesSample), {
					abortSignal: abortController.signal,
					onProcessed,
				}),
			).rejects.toThrowError('Import is cancelled');

			expect(onProcessed).toHaveBeenLastCalledWith({
				stage: 'uploading',
				total: expect.any(Number),
				processed: 1,
			});
		});

		test('Throw on updating stage', async () => {
			const abortController = new AbortController();
			const onProcessed = vi.fn((info: OnProcessedPayload) => {
				if (info.stage === 'updating' && info.processed === 1) {
					abortController.abort(new Error('Import is cancelled'));
				}
			});

			await expect(
				importer.import(createFileManagerMock(filesSample), {
					abortSignal: abortController.signal,
					onProcessed,
				}),
			).rejects.toThrowError('Import is cancelled');

			expect(onProcessed).toHaveBeenLastCalledWith({
				stage: 'updating',
				total: expect.any(Number),
				processed: 1,
			});
		});
	});

	test('Importer throw error if DB closed while importing', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);

		const fileManager = createFileManagerMock();

		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
		const noteVersions = new NoteVersions(db, FAKE_WORKSPACE_NAME);
		const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);

		const attachmentsRegistry = new AttachmentsController(db, FAKE_WORKSPACE_NAME);
		const filesRegistry = new FilesController(db, fileManager, FAKE_WORKSPACE_NAME);

		const importer = new NotesImporter(
			{
				filesRegistry,
				notesRegistry,
				noteVersions,
				attachmentsRegistry,
				tagsRegistry,
			},
			{
				ignorePaths: ['/_resources'],
				noteExtensions: ['.md', '.mdx'],
				convertPathToTag: 'always',
				// Slow down the processing
				throttle: requestAnimationFrame,
			},
		);

		await expect(
			importer.import(createFileManagerMock(filesSample), {
				onProcessed(info) {
					if (info.processed > 0) {
						db.close();
					}
				},
			}),
		).rejects.toThrowError('The database connection is not open');
	});
});
