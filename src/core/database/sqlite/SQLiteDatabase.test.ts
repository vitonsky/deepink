import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openSQLite } from './openSQLite';
import { SQLiteDatabase } from './SQLiteDatabase';
import { qb } from './utils/query-builder';
import { wrapSQLite } from './utils/wrapDB';

test('Custom functions must survive the export', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(() => db.close());

	await expect(db.get().query(`SELECT now() as now`)).resolves.toEqual([
		{ now: expect.any(String) },
	]);

	await expect(db.get().query(`SELECT timestamp('now') as time`)).resolves.toEqual([
		{ time: expect.any(Number) },
	]);
	await expect(
		db.get().query(`SELECT timestamp('10/10/2000') as time`),
	).resolves.toEqual([
		{
			// That is good example of a time problem. Time depends on a time zone,
			// so result will be `971128800000` for Berlin time zone,
			// or `971136000000` for America time zone
			time: new Date('10/10/2000').getTime(),
		},
	]);

	await expect(db.get().query(`SELECT gen_random_uuid() as uuid`)).resolves.toEqual([
		{ uuid: expect.any(String) },
	]);

	await db.get().export();
	await expect(db.get().query(`SELECT gen_random_uuid() as uuid`)).resolves.toEqual([
		{ uuid: expect.any(String) },
	]);

	await db.sync();
	await expect(db.get().query(`SELECT gen_random_uuid() as uuid`)).resolves.toEqual([
		{ uuid: expect.any(String) },
	]);
});

test('Exceptions in callbacks must be ignored', async () => {
	const db = new SQLiteDatabase();
	onTestFinished(() => db.close());

	db.onChange(() => {
		throw new Error('listener failed');
	});

	await db.query('CREATE TABLE t (id INTEGER)');
	await expect(db.query('INSERT INTO t (id) VALUES (1)')).resolves.toEqual([]);
});

describe('SQLite Database persistence', () => {
	const file = createFileControllerMock();

	test('Fill the data', async () => {
		const db = await openSQLite(file);
		onTestFinished(() => db.close());

		const wrappedDb = wrapSQLite(db.get());

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
