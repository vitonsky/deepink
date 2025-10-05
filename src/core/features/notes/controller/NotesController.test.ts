import { TagsController } from '@core/features/tags/controller/TagsController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { NotesController } from './NotesController';

describe('CRUD operations', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('insertion multiple entries', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');

		const entries = [
			{ title: 'Title 1', text: 'Text 1' },
			{ title: 'Title 2', text: 'Text 2' },
			{ title: 'Title 3', text: 'Text 3' },
		];

		const ids = await Promise.all(entries.map((note) => registry.add(note)));
		expect(ids).toHaveLength(entries.length);

		// Entries match data
		await registry.get().then((dbEntries) => {
			dbEntries.forEach((dbEntry) => {
				const entryIndex = ids.indexOf(dbEntry.id);
				const originalEntry = entries[entryIndex];

				expect(dbEntry.content).toMatchObject(originalEntry);
			});
		});
	});

	test('update entry and get by id', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');

		// Entries match data
		const entries = await registry.get();

		const entryV1 = entries[1];

		const modifiedData = { title: 'Modified title', text: 'Modified text' };
		await registry.update(entryV1.id, modifiedData);

		const entryV2 = await registry.getById(entryV1.id);
		expect(entryV2?.content).toMatchObject(modifiedData);
		expect(entryV2?.createdTimestamp).toBe(entryV1.createdTimestamp);
		expect(entryV2?.updatedTimestamp).not.toBe(entryV1.updatedTimestamp);
	});

	test('delete entries', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		// Insert entries to test
		const notesSample = Array(300)
			.fill(null)
			.map((_, idx) => {
				return {
					title: 'Note title #' + idx,
					text: 'Note text #' + idx,
				};
			});

		await Promise.all(notesSample.map((note) => registry.add(note)));

		// Delete notes
		await registry.get({ limit: 100 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete(notes.map((note) => note.id));
			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete - 100);
			});
		});

		await registry.get({ limit: 1 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete([notes[0].id]);
			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete - 1);
			});
		});

		await db.close();
	});
});

describe('data fetching', () => {
	const dbFile = createFileControllerMock();

	const notesSample = Array(300)
		.fill(null)
		.map((_, idx) => {
			return {
				title: 'Note title #' + idx,
				text: 'Note text #' + idx,
			};
		});

	test('insert sample entries', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		const ids: string[] = [];
		for (const note of notesSample) {
			ids.push(await registry.add(note));
		}

		const tags = new TagsController(db, 'fake-workspace-id');
		await tags.setAttachedTags(ids[0], [await tags.add('foo', null)]);
		await tags.setAttachedTags(ids[1], [await tags.add('bar', null)]);

		await db.close();
	});

	test('filter by tags', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');
		const tags = new TagsController(db, 'fake-workspace-id');

		const tagsList = await tags.getTags();

		await expect(
			registry.get({
				tags: [tagsList.find((tag) => tag.resolvedName === 'foo')?.id as string],
			}),
		).resolves.toHaveLength(1);

		await expect(
			registry.get({
				tags: [tagsList.find((tag) => tag.resolvedName === 'bar')?.id as string],
			}),
		).resolves.toHaveLength(1);

		await db.close();
	});

	test('get entries by pages', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		await registry.getLength().then((length) => {
			expect(length).toBe(notesSample.length);
		});

		// Invalid page must throw errors
		await expect(registry.get({ limit: 100, page: 0 })).rejects.toThrow();
		await expect(registry.get({ limit: 100, page: -100 })).rejects.toThrow();

		const page1 = await registry.get({ limit: 100, page: 1 });
		expect(page1[0].content).toMatchObject(notesSample[0]);

		const page2 = await registry.get({ limit: 100, page: 2 });
		expect(page2[0].content).toMatchObject(notesSample[100]);

		await db.close();
	});

	test('method getLength consider filters', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		const notesId = await registry
			.get({ limit: 10 })
			.then((notes) => notes.map((note) => note.id));
		await registry.updateMeta(notesId, { isVisible: false });

		await expect(registry.getLength({ meta: { isVisible: false } })).resolves.toBe(
			10,
		);
		await expect(registry.getLength({ meta: { isVisible: true } })).resolves.toBe(
			notesSample.length - 10,
		);

		await db.close();
	});
});

describe('multi instances', () => {
	const dbFile = createFileControllerMock();

	test('insertion multiple entries and close with sync data', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		const notes = [
			{ title: 'Title 1', text: 'Text 1' },
			{ title: 'Title 2', text: 'Text 2' },
			{ title: 'Title 3', text: 'Text 3' },
		];

		await Promise.all(notes.map((note) => registry.add(note)));
		await db.close();
	});

	test('read entries from previous step', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		// Entries match data
		const entries = await registry.get();

		expect(entries).toHaveLength(3);
		expect(entries[1].content.title.length).toBeGreaterThan(0);
		expect(entries[1].content.text.length).toBeGreaterThan(0);
		await db.close();
	});
});

describe('Notes meta control', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('toggle note versions control', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');

		// Create note
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isSnapshotsDisabled: false,
		});

		// Toggle snapshotting preferences
		await registry.updateMeta([noteId], { isSnapshotsDisabled: true });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isSnapshotsDisabled: true,
		});

		// Toggle snapshotting preferences back
		await registry.updateMeta([noteId], { isSnapshotsDisabled: false });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isSnapshotsDisabled: false,
		});
	});

	test('toggle note visibility', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');

		// Create note
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isVisible: true,
		});
		await expect(registry.get()).resolves.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);

		// Toggle snapshotting preferences
		await registry.updateMeta([noteId], { isVisible: false });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isVisible: false,
		});
		await expect(registry.get()).resolves.not.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);

		// Toggle snapshotting preferences back
		await registry.updateMeta([noteId], { isVisible: true });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isVisible: true,
		});
		await expect(registry.get()).resolves.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);
	});
});
