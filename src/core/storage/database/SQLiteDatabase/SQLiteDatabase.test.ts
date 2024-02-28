import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from './SQLiteDatabase';

describe('migrations', () => {
	test('from most old version to latest', async () => {
		const dbFile = createFileControllerMock();

		// Write DB
		const setupSQL = `CREATE TABLE "notes" (
			"id" TEXT NOT NULL UNIQUE,
			"title" TEXT NOT NULL,
			"text" TEXT NOT NULL,
			"creationTime" INTEGER NOT NULL DEFAULT 0,
			"lastUpdateTime" INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY("id")
		);`;

		await dbFile.write(new TextEncoder().encode(setupSQL));

		// Test structure
		const db = await openDatabase(dbFile);

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

		const dbFile = createFileControllerMock();

		const db1 = await openDatabase(dbFile, { encryption: createEncryption(7) });
		await db1.close();

		const db2 = await openDatabase(dbFile, { encryption: createEncryption(7) });
		await db2.close();

		await expect(async () => {
			await openDatabase(dbFile, { encryption: createEncryption(8) });
		}).rejects.toThrow();
	});
});

describe('concurrency', () => {
	test('throw exception for attempt to sync DB that been closed', async () => {
		const dbFile = createFileControllerMock();

		const db = await openDatabase(dbFile);
		await expect(db.sync()).resolves.not.toThrow();
		await expect(db.sync()).resolves.not.toThrow();

		await db.close();

		await expect(async () => {
			await db.sync();
		}).rejects.toThrow();
	});
});
