import { statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';

import { openDatabase } from './SQLiteDatabase';

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
		const db = await openDatabase(dbPath);

		const tablesList = db.db
			.prepare(`SELECT name FROM main.sqlite_master WHERE type='table'`)
			.all();
		expect(tablesList).toEqual(
			['notes', 'files', 'attachments'].map((name) => ({ name })),
		);

		await db.close();
	});
});

describe('options', () => {
	test('database encryption applies to a data', async () => {
		const createEncryption = (key: number) => {
			const swapBits = async (rawData: string | ArrayBuffer) => {
				if (typeof rawData === 'string')
					return (
						Array.from(rawData)
							// eslint-disable-next-line no-bitwise
							.map((e) => String.fromCharCode(e.charCodeAt(0) ^ key))
							.join('') as any
					);

				// eslint-disable-next-line no-bitwise
				return Buffer.from(rawData).map((e) => e ^ key);
			};

			return {
				encrypt: swapBits,
				decrypt: swapBits,
			};
		};

		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db1 = await openDatabase(dbPath, { encryption: createEncryption(7) });
		await db1.close();

		const db2 = await openDatabase(dbPath, { encryption: createEncryption(7) });
		await db2.close();

		await expect(async () => {
			await openDatabase(dbPath, { encryption: createEncryption(8) });
		}).rejects.toThrow();
	});
});

describe('concurrency', () => {
	test('throw exception for attempt to open DB that already opened and locked', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db = await openDatabase(dbPath);
		await expect(async () => {
			await openDatabase(dbPath);
		}).rejects.toThrow('Database file are locked');

		await db.close();
	});

	test('database file unlocked after close DB', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db1 = await openDatabase(dbPath);
		await db1.close();

		const db2 = await openDatabase(dbPath);
		await db2.close();

		const db3 = await openDatabase(dbPath);
		await db3.close();
	});

	test('throw exception for attempt to sync DB that been closed', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db = await openDatabase(dbPath);
		await expect(db.sync()).resolves.not.toThrow();
		await expect(db.sync()).resolves.not.toThrow();

		await db.close();

		await expect(async () => {
			await db.sync();
		}).rejects.toThrow();
	});
});

describe('consistency', () => {
	test('preserve inode', async () => {
		const dbPath = tmpNameSync({ dir: tmpdir() });

		const db = await openDatabase(dbPath);
		await db.sync();

		const fileUniqueId = statSync(dbPath).ino;

		await db.sync();
		expect(statSync(dbPath).ino).toBe(fileUniqueId);

		await db.close();
	});
});
