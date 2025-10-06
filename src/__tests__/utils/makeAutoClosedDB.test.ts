import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';

import { makeAutoClosedDB } from './makeAutoClosedDB';

describe('DB is closed at hook time', () => {
	describe('afterAll (default)', () => {
		let dbFromFirstTest: PGLiteDatabase;

		describe('DB is available for all tests inside describe block', () => {
			const { getDB } = makeAutoClosedDB();

			test('DB is available when test in run', async () => {
				const db = await getDB();
				expect(db).toHaveProperty('get', expect.any(Function));
				expect(db.get().closed).toBe(false);
				await expect(db.get().query(`SELECT NOW() as time;`)).resolves.toEqual(
					expect.objectContaining({
						rows: expect.arrayContaining([
							{
								time: expect.any(Date),
							},
						]),
					}),
				);

				dbFromFirstTest = db;
			});

			test('DB is available for next test', async () => {
				expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
				expect(dbFromFirstTest.get().closed).toBe(false);
				await expect(
					dbFromFirstTest.get().query(`SELECT NOW() as time;`),
				).resolves.toEqual(
					expect.objectContaining({
						rows: expect.arrayContaining([
							{
								time: expect.any(Date),
							},
						]),
					}),
				);
			});
		});

		test('DB is not available after block where hook is called', async () => {
			expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
			expect(dbFromFirstTest.get().closed).toBe(true);
			await expect(
				dbFromFirstTest.get().query(`SELECT NOW() as time;`),
			).rejects.toThrowError('PGlite is closed');
		});
	});

	describe('afterEach', () => {
		const { getDB } = makeAutoClosedDB({ closeHook: afterEach });

		let dbFromFirstTest: PGLiteDatabase;
		test('DB is available when test in run', async () => {
			const db = await getDB();
			expect(db).toHaveProperty('get', expect.any(Function));
			expect(db.get().closed).toBe(false);
			await expect(db.get().query(`SELECT NOW() as time;`)).resolves.toEqual(
				expect.objectContaining({
					rows: expect.arrayContaining([
						{
							time: expect.any(Date),
						},
					]),
				}),
			);

			dbFromFirstTest = db;
		});

		test('DB is closed for next test', async () => {
			expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
			expect(dbFromFirstTest.get().closed).toBe(true);
			await expect(
				dbFromFirstTest.get().query(`SELECT NOW() as time;`),
			).rejects.toThrowError('PGlite is closed');
		});
	});
});
