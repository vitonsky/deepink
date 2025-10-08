import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from './PGLiteDatabase';

describe('Database persistence', () => {
	const file = createFileControllerMock();

	test('Database must dump its content while closing', async () => {
		const dbContainer = await openDatabase(file);
		const db = dbContainer.get();

		await db.query(
			`CREATE TABLE test (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), text TEXT NOT NULL)`,
		);
		await db.query(`INSERT INTO test(text) VALUES ('Hello world')`);

		await dbContainer.close();
	});

	test('Database must restore its data while initialization', async () => {
		const dbContainer = await openDatabase(file);
		const db = dbContainer.get();

		await expect(db.query('SELECT * FROM test;')).resolves.toEqual(
			expect.objectContaining({
				rows: [
					{
						id: expect.any(String),
						text: 'Hello world',
					},
				],
			}),
		);

		await dbContainer.close();
	});
});
