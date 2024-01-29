import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';

import { openDatabase } from '../storage/database/SQLiteDatabase/SQLiteDatabase';
import { NotesRegistry } from './NotesRegistry';

describe('CRUD operations', () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });
	const dbPromise = openDatabase({ dbPath });

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('insertion multiple entries', async () => {
		const db = await dbPromise;
		const registry = new NotesRegistry(db);

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

				expect(dbEntry.data).toMatchObject(originalEntry);
			});
		});
	});

	test('update entry and get by id', async () => {
		const db = await dbPromise;
		const registry = new NotesRegistry(db);

		// Entries match data
		const entries = await registry.get();

		const entryV1 = entries[1];

		const modifiedData = { title: 'Modified title', text: 'Modified text' };
		await registry.update(entryV1.id, modifiedData);

		const entryV2 = await registry.getById(entryV1.id);
		expect(entryV2?.data).toMatchObject(modifiedData);
		expect(entryV2?.createdTimestamp).toBe(entryV1.createdTimestamp);
		expect(entryV2?.updatedTimestamp).not.toBe(entryV1.updatedTimestamp);
	});

	test('delete entries', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });
		const db = await openDatabase({ dbPath });
		const registry = new NotesRegistry(db);

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
	const dbPath = tmpNameSync({ dir: tmpdir() });

	const notesSample = Array(300)
		.fill(null)
		.map((_, idx) => {
			return {
				title: 'Note title #' + idx,
				text: 'Note text #' + idx,
			};
		});

	test('insert sample entries', async () => {
		const db = await openDatabase({ dbPath });
		const registry = new NotesRegistry(db);

		for (const note of notesSample) {
			await registry.add(note);
		}

		await db.close();
	});

	test('get entries by pages', async () => {
		const db = await openDatabase({ dbPath });
		const registry = new NotesRegistry(db);

		await registry.getLength().then((length) => {
			expect(length).toBe(notesSample.length);
		});

		// Invalid page must throw errors
		await expect(registry.get({ limit: 100, page: 0 })).rejects.toThrow();
		await expect(registry.get({ limit: 100, page: -100 })).rejects.toThrow();

		const page1 = await registry.get({ limit: 100, page: 1 });
		expect(page1[0].data).toMatchObject(notesSample[0]);

		const page2 = await registry.get({ limit: 100, page: 2 });
		expect(page2[0].data).toMatchObject(notesSample[100]);

		await db.close();
	});
});

describe('multi instances', () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });

	test('insertion multiple entries and close with sync data', async () => {
		const db = await openDatabase({ dbPath });
		const registry = new NotesRegistry(db);

		const notes = [
			{ title: 'Title 1', text: 'Text 1' },
			{ title: 'Title 2', text: 'Text 2' },
			{ title: 'Title 3', text: 'Text 3' },
		];

		await Promise.all(notes.map((note) => registry.add(note)));
		await db.close();
	});

	test('read entries from previous step', async () => {
		const db = await openDatabase({ dbPath });
		const registry = new NotesRegistry(db);

		// Entries match data
		const entries = await registry.get();

		expect(entries).toHaveLength(3);
		expect(entries[1].data.title.length).toBeGreaterThan(0);
		expect(entries[1].data.text.length).toBeGreaterThan(0);
		await db.close();
	});
});
