import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { tmpNameSync } from 'tmp';

import { getDb } from './SQLiteDb';

// TODO: move extensions to dir with DB
const dbExtensionsDir = path.join(__dirname, '../../../sqlite/extensions');

describe('migrations', () => {
	test('from most old version to latest', async () => {
		// Write DB
		const dbPath = tmpNameSync({ dir: tmpdir() });
		const setupSQL = `CREATE TABLE "notes" (
			"id" TEXT NOT NULL UNIQUE,
			"title" TEXT NOT NULL,
			"text" TEXT NOT NULL,
			"creationTime" INTEGER NOT NULL DEFAULT 0,
			"lastUpdateTime" INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY("id")
		);`;
		writeFileSync(dbPath, setupSQL);

		// Test structure
		const db = await getDb({ dbPath, dbExtensionsDir });

		const tablesList = await db.db.all(
			`SELECT name FROM main.sqlite_master WHERE type='table'`,
		);
		expect(tablesList).toEqual(
			['notes', 'files', 'attachments'].map((name) => ({ name })),
		);

		await db.close();
	});
});
