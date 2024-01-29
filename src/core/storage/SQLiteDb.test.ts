import { statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';

import { getDb } from './SQLiteDb';

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
		const db = await getDb({ dbPath });

		const tablesList = db.db
			.prepare(`SELECT name FROM main.sqlite_master WHERE type='table'`)
			.all();
		expect(tablesList).toEqual(
			['notes', 'files', 'attachments'].map((name) => ({ name })),
		);

		await db.close();
	});
});

describe('concurrency', () => {
	test('throw exception for attempt to open DB that already opened and locked', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db1 = await getDb({ dbPath });
		await expect(async () => {
			await getDb({ dbPath });
		}).rejects.toThrow('Database file are locked');

		await db1.close();
	});
});

describe('consistency', () => {
	test('preserve inode', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db = await getDb({ dbPath });
		await db.sync();

		const fileUniqueId = statSync(dbPath).ino;

		await db.sync();
		expect(statSync(dbPath).ino).toBe(fileUniqueId);

		await db.close();
	});
});
