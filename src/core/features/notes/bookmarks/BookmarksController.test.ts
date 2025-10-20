import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from '../controller/NotesController';
import { BookmarksController } from './BookmarksController';

const FAKE_WORKSPACE_ID = getUUID();

test('add bookmark', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);
	const registry = new NotesController(db, FAKE_WORKSPACE_ID);
	const bookmarks = new BookmarksController(db);

	// prepare data
	const note = await registry.add({ title: 'Title 1', text: 'Text 1' });
	await bookmarks.add(note);

	// checks
	await expect(bookmarks.has(note)).resolves.toBeTruthy();
});

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

	// bookmarking notes
	const toBookmark = notes.slice(0, 3);
	await Promise.all(toBookmark.map((id) => bookmarks.add(id)));
	for (const id of toBookmark) {
		await expect(bookmarks.has(id)).resolves.toBe(true);
	}

	const toRemove = toBookmark;
	await expect(bookmarks.remove(toRemove)).resolves.not.toThrow();

	for (const id of toRemove) {
		await expect(bookmarks.has(id)).resolves.toBe(false);
	}

	await expect(bookmarks.has(notes[3])).resolves.toBe(false);
});
