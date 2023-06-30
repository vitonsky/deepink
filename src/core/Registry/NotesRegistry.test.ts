import { getDb } from '../storage/SQLiteDb';
import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';
import path from 'path';
import { NotesRegistry } from './NotesRegistry';

// TODO: move extensions to dir with DB
const dbExtensionsDir = path.join(__dirname, '../../../sqlite/extensions');

describe('CRUD operations', () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });
	const dbPromise = getDb({ dbPath, dbExtensionsDir });

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
		await registry.get().then(((dbEntries) => {
			dbEntries.forEach((dbEntry) => {
				const entryIndex = ids.indexOf(dbEntry.id);
				const originalEntry = entries[entryIndex];

				expect(dbEntry.data).toMatchObject(originalEntry);
			})
		}));
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
});

describe('data fetching', () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });

	const notesSample = Array(1000).fill(null).map((_, idx) => {
		return {
			title: 'Note title #' + idx,
			text: 'Note text #' + idx,
		};
	});

	test('insert sample entries', async () => {
		const db = await getDb({ dbPath, dbExtensionsDir });
		const registry = new NotesRegistry(db);

		for (const note of notesSample) {
			await registry.add(note);
		}

		await db.close();
	});

	test('get entries by pages', async () => {
		const db = await getDb({ dbPath, dbExtensionsDir });
		const registry = new NotesRegistry(db);

		// Invalid page must throw errors
		await expect(registry.get({ limit: 100, page: 0 })).rejects.toThrow()
		await expect(registry.get({ limit: 100, page: -100 })).rejects.toThrow()

		const page1 = await registry.get({ limit: 100, page: 1 });
		expect(page1[0].data).toMatchObject(notesSample[0]);

		const page2 = await registry.get({ limit: 100, page: 2 });
		expect(page2[0].data).toMatchObject(notesSample[100]);

		await db.close();
	});
})

describe('multi instances', () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });

	test('insertion multiple entries and close with sync data', async () => {
		const db = await getDb({ dbPath, dbExtensionsDir });
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
		const db = await getDb({ dbPath, dbExtensionsDir });
		const registry = new NotesRegistry(db);

		// Entries match data
		const entries = await registry.get();

		expect(entries).toHaveLength(3);
		expect(entries[1].data.title.length).toBeGreaterThan(0);
		expect(entries[1].data.text.length).toBeGreaterThan(0);
		await db.close();
	});

	test('sync and load', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db1 = await getDb({ dbPath, dbExtensionsDir });
		const registry1 = new NotesRegistry(db1);

		const entryId = await registry1.add({ title: 'Title 1', text: 'Text 1' });

		const db2 = await getDb({ dbPath, dbExtensionsDir });
		const registry2 = new NotesRegistry(db2);
		const entryById = await registry2.getById(entryId);
		expect(entryById).not.toBe(null);

		await db1.close();
		await db2.close();
	});
});

describe.skip('stress tests', () => {
	// TODO: implement compression in memory and enable test
	// With no compression this data takes 8Gb RAM
	// Gzipped data takes ~800kb. We must to compress data
	test('insert a lot of entries', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });
		const db = await getDb({ dbPath, dbExtensionsDir });
		const registry = new NotesRegistry(db);

		const requests: Promise<string>[] = [];

		// Insert entries
		let iters = 0;
		const textSample = "Some long text ".repeat(10000);
		for (let i = 0; i < 10000; i++) {
			const promise = registry.add({
				title: `Title #${i}`,
				text: textSample
			}).then((id) => {
				iters++;

				if (iters % 100 === 0) {
					console.log('Inserted entries: ', iters);
				}

				return id;
			});

			requests.push(promise);
		}

		// Await requests will done and test data
		const ids = await Promise.all(requests);
		expect(ids).toHaveLength(requests.length);

		// TODO: Test size of `dbPath` must not be too long

		await db.close();
	}, 20000);
})