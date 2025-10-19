import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from '../controller/NotesController';
import { BookmarksController } from './Bookmarks';

const FAKE_WORKSPACE_ID = getUUID();

test('remove bookmarks', async () => {
	const dbFile = createFileControllerMock();

	const db = await openDatabase(dbFile);
	const registry = new NotesController(db, FAKE_WORKSPACE_ID);
	const bookmarks = new BookmarksController(db);

	// Create note
	const entities = [
		{ title: 'Title 1', text: 'Text 1' },
		{ title: 'Title 2', text: 'Text 2' },
		{ title: 'Title 3', text: 'Text 3' },
		{ title: 'Title 4', text: 'Text 4' },
	];
	const notes = await Promise.all(entities.map((note) => registry.add(note)));
	const note = notes[0];

	// bookmarking
	await Promise.all(notes.slice(0, 2).map((note) => bookmarks.add(note)));
	await expect(bookmarks.get(note)).resolves.toBeTruthy();

	// remove bookmarks
	await expect(bookmarks.remove(note)).resolves.not.toThrowError();
	await expect(bookmarks.get(note)).resolves.toBeFalsy();
});
