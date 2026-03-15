import { Database } from './Database';

test('sqlite query', async () => {
	const db = new Database();
	expect(
		db.query(`SELECT strftime('%Y-%m-%d %H:%M:%S', datetime('now')) as now`),
	).resolves.toEqual([{ now: expect.any(String) }]);
});
