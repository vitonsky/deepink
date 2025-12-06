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
