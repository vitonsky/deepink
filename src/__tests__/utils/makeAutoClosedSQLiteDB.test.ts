import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';

import { makeAutoClosedSQLiteDB } from './makeAutoClosedSQLiteDB';

describe('DB is closed at hook time', () => {
	describe('afterAll (default)', () => {
		let dbFromFirstTest: ManagedDatabase<SQLiteDB>;

		describe('DB is available for all tests inside describe block', () => {
			const { getDB } = makeAutoClosedSQLiteDB();

			test('DB is available when test in run', async () => {
				const db = await getDB();
				expect(db).toHaveProperty('get', expect.any(Function));
				expect(db.dbContainer.isOpened()).toBe(true);
				await expect(db.get().query(`SELECT NOW() as time;`)).resolves.toEqual(
					expect.arrayContaining([
						{
							time: expect.any(String),
						},
					]),
				);

				dbFromFirstTest = db;
			});

			test('DB is available for next test', async () => {
				expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
				expect(dbFromFirstTest.dbContainer.isOpened()).toBe(true);
				await expect(
					dbFromFirstTest.get().query(`SELECT NOW() as time;`),
				).resolves.toEqual(
					expect.arrayContaining([
						{
							time: expect.any(String),
						},
					]),
				);
			});
		});

		test('DB is not available after block where hook is called', async () => {
			expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
			expect(dbFromFirstTest.dbContainer.isOpened()).toBe(false);
			await expect(
				dbFromFirstTest.get().query(`SELECT NOW() as time;`),
			).rejects.toThrowError('Database is closed');
		});
	});

	describe('afterEach', () => {
		const { getDB } = makeAutoClosedSQLiteDB({ closeHook: afterEach });

		let dbFromFirstTest: ManagedDatabase<SQLiteDB>;
		test('DB is available when test in run', async () => {
			const db = await getDB();
			expect(db).toHaveProperty('get', expect.any(Function));
			expect(db.dbContainer.isOpened()).toBe(true);
			await expect(db.get().query(`SELECT NOW() as time;`)).resolves.toEqual(
				expect.arrayContaining([
					{
						time: expect.any(String),
					},
				]),
			);

			dbFromFirstTest = db;
		});

		test('DB is closed for next test', async () => {
			expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
			expect(dbFromFirstTest.dbContainer.isOpened()).toBe(false);
			await expect(
				dbFromFirstTest.get().query(`SELECT NOW() as time;`),
			).rejects.toThrowError('Database is closed');
		});
	});
});
