import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from './NotesController';

function getRandomNumber(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FAKE_WORKSPACE_ID = getUUID();

describe('stress tests', () => {
	const dbFile = createFileControllerMock();

	// TODO: implement compression in memory and enable test
	// With no compression this data takes 8Gb RAM
	// Gzipped data takes ~800kb. We must to compress data
	test('insert 10k notes contains 150k chars', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

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

		await db.close();
	}, 60000);

	test('update random notes 10k times', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		const noteIds = await registry.get().then((notes) => notes.map(({ id }) => id));

		for (let i = 0; i < 10000; i++) {
			const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

			const updatedData = {
				text: `Updated text for iteration #${i}`,
				title: `Updated title for iteration #${i}`,
			};
			await registry.update(randomId, updatedData);
			await registry.getById(randomId).then((note) => {
				expect(note?.content).toEqual(updatedData);
			});
		}

		await db.close();
	}, 60000);
});
