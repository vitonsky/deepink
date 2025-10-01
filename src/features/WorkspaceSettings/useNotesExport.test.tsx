// @vitest-environment jsdom
import React from 'react';
import { act } from 'react-dom/test-utils';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { FilesController } from '@core/features/files/FilesController';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { ZipFS } from '@core/features/files/ZipFS';
import { formatResourceLink } from '@core/features/links';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { openDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { NoteExportData } from '@core/storage/interop/export';
import {
	FilesRegistryContext,
	NotesRegistryContext,
	TagsRegistryContext,
} from '@features/App/Workspace/WorkspaceProvider';
import { renderHook } from '@testing-library/react';
import * as fsClientMock from '@utils/fs/__tests__/client.mock';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { configureNoteNameGetter, useNotesExport } from './useNotesExport';

vi.mock('@utils/fs/client', async () => fsClientMock);

afterEach(() => {
	vi.clearAllMocks();
});

describe('Export notes', async () => {
	const FAKE_WORKSPACE_NAME = 'fake-workspace-id';

	const fileManager = createFileManagerMock();

	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('Add test data', async () => {
		const db = await dbPromise;
		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
		const filesRegistry = new FilesController(db, fileManager, FAKE_WORKSPACE_NAME);
		const attachments = new AttachmentsController(db, FAKE_WORKSPACE_NAME);

		await notesRegistry.add({
			title: 'Title 1',
			text: '',
		});
		await notesRegistry.add({
			title: 'Title 2',
			text: '',
		});

		const fileId = await filesRegistry.add(
			new File(['File text content'], 'attachment.txt', {
				type: 'text/plain',
			}),
		);
		await attachments.set(
			await notesRegistry.add({
				title: 'Note with attachment',
				text: `Note with attached [file](${formatResourceLink(fileId)})`,
			}),
			[fileId],
		);
	});

	test('Export all notes via useNotesExport', async () => {
		const db = await dbPromise;
		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
		const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);
		const filesRegistry = new FilesController(db, fileManager, FAKE_WORKSPACE_NAME);

		const { result } = renderHook(useNotesExport, {
			wrapper(props) {
				return (
					<FilesRegistryContext.Provider value={filesRegistry}>
						<NotesRegistryContext.Provider value={notesRegistry}>
							<TagsRegistryContext.Provider value={tagsRegistry}>
								{props.children}
							</TagsRegistryContext.Provider>
						</NotesRegistryContext.Provider>
					</FilesRegistryContext.Provider>
				);
			},
		});

		// Export all notes
		await act(async () => {
			await expect(
				result.current.exportNotes(true, 'custom-name'),
			).resolves.not.toThrow();
		});

		// File must be saved
		expect(fsClientMock.saveFile.mock.calls).toEqual([
			['/foo/bar/custom_name.zip', expect.any(ArrayBuffer)],
		]);

		// File content is a zip file
		const fs = new ZipFS(new InMemoryFS());
		await fs.load(fsClientMock.saveFile.mock.calls[0][1]);

		await expect(fs.list()).resolves.toStrictEqual([
			'/Title_1-1.md',
			'/Title_2-1.md',
			expect.stringMatching('/_resources/[\\w\\d-]+-attachment.txt'),
			'/Note_with_attachment-1.md',
		]);
	});

	test('Export single note via useNotesExport', async () => {
		const db = await dbPromise;
		const notesRegistry = new NotesController(db, FAKE_WORKSPACE_NAME);
		const tagsRegistry = new TagsController(db, FAKE_WORKSPACE_NAME);
		const filesRegistry = new FilesController(db, fileManager, FAKE_WORKSPACE_NAME);

		const { result } = renderHook(useNotesExport, {
			wrapper(props) {
				return (
					<FilesRegistryContext.Provider value={filesRegistry}>
						<NotesRegistryContext.Provider value={notesRegistry}>
							<TagsRegistryContext.Provider value={tagsRegistry}>
								{props.children}
							</TagsRegistryContext.Provider>
						</NotesRegistryContext.Provider>
					</FilesRegistryContext.Provider>
				);
			},
		});

		// Export note
		const noteWithAttachment = await notesRegistry
			.get()
			.then((notes) =>
				notes.find((note) => note.content.title === 'Note with attachment'),
			);
		if (!noteWithAttachment) throw new Error('Note with attachment not found');

		await act(async () => {
			await expect(
				result.current.exportNote(noteWithAttachment.id, true, 'custom-name'),
			).resolves.not.toThrow();
		});

		// File must be saved
		expect(fsClientMock.saveFile.mock.calls).toEqual([
			['/foo/bar/custom_name.zip', expect.any(ArrayBuffer)],
		]);

		// File content is a zip file
		const fs = new ZipFS(new InMemoryFS());
		await fs.load(fsClientMock.saveFile.mock.calls[0][1]);

		await expect(fs.list()).resolves.toStrictEqual([
			expect.stringMatching('/_resources/[\\w\\d-]+-attachment.txt'),
			'/Note_with_attachment-1.md',
		]);
	});
});

describe('File names', () => {
	test('Many notes mode', () => {
		const getName = configureNoteNameGetter();

		expect(
			getName({
				id: 'id1',
				content: { title: 'foo' },
				tags: [],
			} as unknown as NoteExportData),
		).toBe('/foo.md');
		expect(
			getName({
				id: 'id2',
				content: { title: '' },
				tags: [],
			} as unknown as NoteExportData),
		).toBe('/id2.md');
		expect(
			getName({
				id: 'id3',
				content: { title: 'foo' },
				tags: [],
			} as unknown as NoteExportData),
		).toBe('/foo-1.md');
		expect(
			getName({
				id: 'id4',
				content: { title: 'foo' },
				tags: ['foo', 'bar', 'x/y', 'baz'],
			} as unknown as NoteExportData),
		).toBe('/x/y/foo.md');
		expect(
			getName({
				id: 'id5',
				content: { title: '/x/y/z#?$%' },
				tags: [],
			} as unknown as NoteExportData),
		).toBe('/x_y_z_.md');
		expect(
			getName({
				id: 'id5',
				content: { title: '/x/y/z' },
				tags: ['foo/bar/baz'],
			} as unknown as NoteExportData),
		).toBe('/foo/bar/baz/x_y_z.md');
	});

	test('Single note mode', () => {
		const getName = configureNoteNameGetter(true);

		expect(
			getName({
				id: 'id1',
				content: { title: 'foo' },
				tags: [],
			} as unknown as NoteExportData),
		).toBe('/foo.md');
		expect(
			getName({
				id: 'id2',
				content: { title: '' },
				tags: [],
			} as unknown as NoteExportData),
		).toBe('/id2.md');
		expect(
			getName({
				id: 'id3',
				content: { title: 'foo' },
				tags: [],
			} as unknown as NoteExportData),
		).toBe('/foo-1.md');
		expect(
			getName({
				id: 'id4',
				content: { title: 'foo' },
				tags: ['foo', 'bar', 'x/y', 'baz'],
			} as unknown as NoteExportData),
		).toBe('/foo-2.md');
	});
});
