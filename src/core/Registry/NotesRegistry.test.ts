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

