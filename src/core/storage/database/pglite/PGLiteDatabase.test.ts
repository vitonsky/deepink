import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from './PGLiteDatabase';

const file = createFileControllerMock();

test('Init DB and close', async () => {
	const dbContainer = await openDatabase(file);
	const db = dbContainer.get();

	await db.query(
		`CREATE TABLE test (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), text TEXT NOT NULL)`,
	);
	await db.query(`INSERT INTO test(text) VALUES ('Hello world')`);

	await dbContainer.close();
});

test('Load DB with all data', async () => {
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
