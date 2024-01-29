import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';

import { getDb } from '../storage/SQLiteDb';
import { rm } from 'fs/promises';
import { NotesRegistry } from './NotesRegistry';

function getRandomNumber(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('stress tests', () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });

	afterAll(async () => {
		await rm(dbPath);
	});

	// TODO: implement compression in memory and enable test
	// With no compression this data takes 8Gb RAM
	// Gzipped data takes ~800kb. We must to compress data
	test('insert 10k notes contains 150k chars', async () => {
		const db = await getDb({ dbPath });
		const registry = new NotesRegistry(db);

		const requests: Promise<string>[] = [];

		// Insert entries
		const textSample = 'Some long text '.repeat(10000);
		for (let i = 0; i < 10000; i++) {
			const promise = registry.add({
				title: `Title #${i}`,
				text: textSample,
			});

			requests.push(promise);
		}

		// Await requests will done and test data
		const ids = await Promise.all(requests);
		expect(ids).toHaveLength(requests.length);

		expect(await registry.getLength()).toBe(requests.length);

		await db.sync();
		await db.close();
	}, 60000);

	test('update random notes 10k times', async () => {
		const db = await getDb({ dbPath });
		const registry = new NotesRegistry(db);

		const noteIds = await registry.get().then((notes) => notes.map(({ id }) => id));

		for (let i = 0; i < 10000; i++) {
			const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

			const updatedData = {
				text: `Updated text for iteration #${i}`,
				title: `Updated title for iteration #${i}`,
			};
			await registry.update(randomId, updatedData);
			await registry.getById(randomId).then((note) => {
				expect(note?.data).toEqual(updatedData);
			});
		}

		await db.sync();
		await db.close();
	}, 60000);
});
