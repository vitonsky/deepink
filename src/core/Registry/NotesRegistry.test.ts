import { getDb } from '../storage/SQLiteDb';
import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';
import path from 'path';
import { NotesRegistry } from './NotesRegistry';

// TODO: move extensions to dir with DB
const dbExtensionsDir = path.join(__dirname, '../../../sqliteExtensions');

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
		await db1.sync();

		const db2 = await getDb({ dbPath, dbExtensionsDir });
		const registry2 = new NotesRegistry(db2);
		const entryById = await registry2.getById(entryId);
		expect(entryById).not.toBe(null);

		await db1.close();
		await db2.close();
	});
});