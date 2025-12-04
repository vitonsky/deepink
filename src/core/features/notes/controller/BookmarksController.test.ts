import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { BookmarksController } from './BookmarksController';
import { NotesController } from './NotesController';

const FAKE_WORKSPACE_ID = getUUID();

test('add bookmark', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);
	const noteRegistry = new NotesController(db, FAKE_WORKSPACE_ID);
	const bookmarksRegistry = new BookmarksController(db, FAKE_WORKSPACE_ID);

	// prepare data
	const note = await noteRegistry.add({ title: 'Title 1', text: 'Text 1' });
	await bookmarksRegistry.add(note);
	await expect(bookmarksRegistry.has(note)).resolves.toBeTruthy();

	await bookmarksRegistry.remove([note]);
	await expect(bookmarksRegistry.has(note)).resolves.toBeFalsy();
});

test('remove bookmarks', async () => {
	const notesSample = Array(100)
		.fill(null)
		.map((_, idx) => {
			return {
				title: 'Note title #' + idx,
				text: 'Note text #' + idx,
			};
		});

	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);
	const noteRegistry = new NotesController(db, FAKE_WORKSPACE_ID);
	const bookmarksRegistry = new BookmarksController(db, FAKE_WORKSPACE_ID);

	// prepare data
	const ids = await Promise.all(notesSample.map((note) => noteRegistry.add(note)));
	await Promise.all(ids.slice(0, 50).map((id) => bookmarksRegistry.add(id)));

	await expect(bookmarksRegistry.getList()).resolves.toHaveLength(50);

	await expect(bookmarksRegistry.remove(ids.slice(0, 30))).resolves.toBeUndefined();
	await expect(bookmarksRegistry.getList()).resolves.toHaveLength(20);
});
