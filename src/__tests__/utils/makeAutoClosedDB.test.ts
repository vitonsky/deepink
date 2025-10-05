import { makeAutoClosedDB } from './makeAutoClosedDB';

describe('DB is closed at hook time', () => {
	describe('afterAll (default)', () => {
		let dbFromFirstTest: any;

		describe('DB is available for all tests inside describe block', () => {
			const { getDB } = makeAutoClosedDB();

			test('DB is available when test in run', async () => {
				const db = await getDB();
				expect(db).toHaveProperty('get', expect.any(Function));
				expect(db.get().open).toBe(true);
				expect(db.get().prepare(`SELECT TIME('now') as time;`).get()).toEqual({
					time: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
				});

				dbFromFirstTest = db;
			});

			test('DB is available for next test', async () => {
				expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
				expect(dbFromFirstTest.get().open).toBe(true);
				expect(
					dbFromFirstTest.get().prepare(`SELECT TIME('now') as time;`).get(),
				).toEqual({
					time: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
				});
			});
		});

		test('DB is not available after block where hook is called', async () => {
			expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
			expect(dbFromFirstTest.get().open).toBe(false);
			expect(() =>
				dbFromFirstTest.get().prepare(`SELECT TIME('now') as time;`).get(),
			).toThrowError('The database connection is not open');
		});
	});

	describe('afterEach', () => {
		const { getDB } = makeAutoClosedDB({ closeHook: afterEach });

		let dbFromFirstTest: any;
		test('DB is available when test in run', async () => {
			const db = await getDB();
			expect(db).toHaveProperty('get', expect.any(Function));
			expect(db.get().open).toBe(true);
			expect(db.get().prepare(`SELECT TIME('now') as time;`).get()).toEqual({
				time: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
			});

			dbFromFirstTest = db;
		});

		test('DB is closed for next test', async () => {
			expect(dbFromFirstTest).toHaveProperty('get', expect.any(Function));
			expect(dbFromFirstTest.get().open).toBe(false);
			expect(() =>
				dbFromFirstTest.get().prepare(`SELECT TIME('now') as time;`).get(),
			).toThrowError('The database connection is not open');
		});
	});
});
