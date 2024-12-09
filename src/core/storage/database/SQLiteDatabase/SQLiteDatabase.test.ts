import { FileControllerWithEncryption } from '@core/features/files/FileControllerWithEncryption';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';
import { wait } from '@utils/tests';

import { openDatabase, SQLiteDatabase } from './SQLiteDatabase';

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

		const tablesList = db
			.get()
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

		const dbFile = new FileControllerWithEncryption(
			createFileControllerMock(),
			createEncryption(7),
		);
		await dbFile.get().then((file) => {
			expect(file).toBe(null);
		});

		const db1 = await openDatabase(dbFile);
		await db1.close();
		await dbFile.get().then((file) => {
			expect(file).toBeInstanceOf(Buffer);
			expect(file!.byteLength).toBeGreaterThan(0);
		});

		const db2 = await openDatabase(dbFile);
		await db2.close();
		await dbFile.get().then((file) => {
			expect(file).toBeInstanceOf(Buffer);
			expect(file!.byteLength).toBeGreaterThan(0);
		});
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

describe('Database auto synchronization', () => {
	const syncOptions = {
		delay: 80,
		deadline: 80 * 4,
	};

	const waitPossibleSync = () => wait(10);

	let writeFnMock: jest.SpyInstance<Promise<void>, [buffer: ArrayBuffer], any>;
	let db: SQLiteDatabase;
	let notes: NotesController;

	afterEach(() => {
		writeFnMock.mockClear();
	});

	test('Sync runs immediately once DB has been opened', async () => {
		const dbFile = createFileControllerMock();

		writeFnMock = jest.spyOn(dbFile, 'write');

		// Open DB
		db = await openDatabase(dbFile, { verbose: false, sync: syncOptions });

		// Check forced sync that has been called while DB opening
		expect(writeFnMock).toBeCalledTimes(1);

		notes = new NotesController(db);
	});

	test('Sync runs for first data mutation', async () => {
		await notes.add({ title: 'Demo title', text: 'Demo text' });
		await waitPossibleSync();
		expect(writeFnMock).toBeCalledTimes(1);
	});

	test('Data changes in row will be delayed', async () => {
		for (
			const startTime = Date.now();
			Date.now() - startTime < syncOptions.delay * 1.5;

		) {
			await notes.add({ title: 'Demo title', text: 'Demo text' });
		}
		expect(writeFnMock).toBeCalledTimes(0);

		await wait(syncOptions.delay);
		expect(writeFnMock).toBeCalledTimes(1);
	});

	test('Data changes in row will be synced by deadline', async () => {
		for (
			const startTime = Date.now();
			Date.now() - startTime < syncOptions.deadline * 1.1;

		) {
			await notes.add({ title: 'Demo title', text: 'Demo text' });
			await waitPossibleSync();
		}
		expect(writeFnMock).toBeCalledTimes(1);

		// One more sync must be called after delay
		writeFnMock.mockClear();
		await wait(syncOptions.delay);
		expect(writeFnMock).toBeCalledTimes(1);
	});

	test('Sync runs while close DB', async () => {
		await db.close();
		expect(writeFnMock).toBeCalledTimes(1);
	});
});
