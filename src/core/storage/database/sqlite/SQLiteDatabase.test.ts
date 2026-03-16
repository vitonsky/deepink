import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openSQLite } from './openSQLite';
import scheme from './scheme.sql';
import { qb } from './utils/query-builder';
import { wrapSQLite } from './utils/wrapDB';

test('sqlite query', async () => {
	const file = createFileControllerMock();
	const db = await openSQLite(file);

	const wrappedDb = wrapSQLite(db);
	await wrappedDb.query(qb.raw(scheme));

	await expect(
		wrappedDb.query(
			qb.sql`SELECT strftime('%Y-%m-%d %H:%M:%S', datetime('now')) as now`,
		),
	).resolves.toEqual([{ now: expect.any(String) }]);

	await expect(wrappedDb.query(qb.sql`SELECT now() as now`)).resolves.toEqual([
		{ now: expect.any(String) },
	]);

	await expect(
		wrappedDb.query(qb.sql`INSERT INTO workspaces(name) VALUES('test')`),
	).resolves.toEqual([]);
	await expect(wrappedDb.query(qb.sql`SELECT * FROM workspaces`)).resolves.toEqual([
		{ name: 'test', id: expect.any(String) },
	]);
});
