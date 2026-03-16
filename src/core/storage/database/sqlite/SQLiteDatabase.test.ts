import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openSQLite } from './openSQLite';
import scheme from './scheme.sql';
import { qb } from './utils/query-builder';
import { wrapSQLite } from './utils/wrapDB';

test('Test custom functions', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(() => db.close());

	await expect(db.get().query(`SELECT now() as now`)).resolves.toEqual([
		{ now: expect.any(String) },
	]);

	await expect(db.get().query(`SELECT gen_random_uuid() as uuid`)).resolves.toEqual([
		{ uuid: expect.any(String) },
	]);
});

describe('SQLite Database persistence', () => {
	const file = createFileControllerMock();

	test('Fill the data', async () => {
		const db = await openSQLite(file);
		onTestFinished(() => db.close());

		const wrappedDb = wrapSQLite(db.get());
		await wrappedDb.query(qb.raw(scheme));

		await expect(
			wrappedDb.query(qb.sql`INSERT INTO workspaces(name) VALUES('foo')`),
		).resolves.toEqual([]);

		await expect(
			wrappedDb.query(qb.sql`INSERT INTO workspaces(name) VALUES('bar')`),
		).resolves.toEqual([]);

		await expect(wrappedDb.query(qb.sql`SELECT * FROM workspaces`)).resolves.toEqual([
			{ name: 'foo', id: expect.any(String) },
			{ name: 'bar', id: expect.any(String) },
		]);
	});

	test('Use data from previous session', async () => {
		const db = await openSQLite(file);
		onTestFinished(() => db.close());

		const wrappedDb = wrapSQLite(db.get());
		await expect(wrappedDb.query(qb.sql`SELECT * FROM workspaces`)).resolves.toEqual([
			{ name: 'foo', id: expect.any(String) },
			{ name: 'bar', id: expect.any(String) },
		]);
	});
});
