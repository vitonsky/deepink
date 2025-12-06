import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { BookmarksController } from './BookmarksController';
import { NotesController } from './NotesController';

const FAKE_WORKSPACE_ID = getUUID();

test('add and remove bookmark', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);
	const noteRegistry = new NotesController(db, FAKE_WORKSPACE_ID);
	const bookmarksRegistry = new BookmarksController(db, FAKE_WORKSPACE_ID);

	const note = await noteRegistry.add({ title: 'Title 1', text: 'Text 1' });

	await bookmarksRegistry.add(note);
	await expect(bookmarksRegistry.has(note)).resolves.toBeTruthy();

	await bookmarksRegistry.delete([note]);
	await expect(bookmarksRegistry.has(note)).resolves.toBeFalsy();
});

test('bookmark is removed when note is deleted', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);
	const noteRegistry = new NotesController(db, FAKE_WORKSPACE_ID);
	const bookmarksRegistry = new BookmarksController(db, FAKE_WORKSPACE_ID);

	const note = await noteRegistry.add({ title: 'Title 1', text: 'Text 1' });

	await bookmarksRegistry.add(note);
	await expect(bookmarksRegistry.has(note)).resolves.toBeTruthy();
	await expect(bookmarksRegistry.getList()).resolves.toEqual(
		expect.arrayContaining([note]),
	);

	await noteRegistry.delete([note]);

	// deleted notes are removed from bookmarks
	await expect(bookmarksRegistry.has(note)).resolves.toBeFalsy();
	await expect(bookmarksRegistry.getList()).resolves.toEqual(
		expect.arrayContaining([]),
	);
});

test('getList returns correct bookmarks after delete', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);
	const noteRegistry = new NotesController(db, FAKE_WORKSPACE_ID);
	const bookmarksRegistry = new BookmarksController(db, FAKE_WORKSPACE_ID);

	const notes = [
		{ title: 'Note 1', text: 'Text 1' },
		{ title: 'Note 2', text: 'Text 2' },
		{ title: 'Note 3', text: 'Text 3' },
	];
	const noteIds = await Promise.all(notes.map((n) => noteRegistry.add(n)));
	await Promise.all(noteIds.map((n) => bookmarksRegistry.add(n)));
	await expect(bookmarksRegistry.getList()).resolves.toHaveLength(3);

	await bookmarksRegistry.delete([noteIds[0]]);
	await expect(bookmarksRegistry.getList()).resolves.toHaveLength(2);

	await bookmarksRegistry.delete(noteIds);
	await expect(bookmarksRegistry.getList()).resolves.toHaveLength(0);
});
