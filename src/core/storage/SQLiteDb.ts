import { existsSync } from 'fs';
import path from 'path';
import lockfileUtils from 'proper-lockfile';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';

import { recoveryAtomicFile, writeFileAtomic } from '../../utils/files';

import { readFile, writeFile } from 'fs/promises';
import { ExtendedSqliteDatabase } from './ExtendedSqliteDatabase';
import { latestSchemaVersion, migrateToLatestSchema } from './migrations';
import setupSQL from './setup.sql';

export type SQLiteDb = {
	/**
	 * Configured database with extensions
	 */
	db: Database<ExtendedSqliteDatabase, sqlite3.Statement>;

	/**
	 * Write database to file
	 *
	 * DB automatically sync with updates, call this method to force sync
	 */
	sync: () => Promise<void>;

	/**
	 * Sync DB and close
	 */
	close: () => Promise<void>;
};

type Options = {
	dbPath: string;
	dbExtensionsDir: string;

	/**
	 * Option to disable verbose logs
	 */
	verbose?: boolean;
};

export const getDb = async ({
	dbPath,
	dbExtensionsDir,
	verbose: verboseLog = false,
}: Options): Promise<SQLiteDb> => {
	// Ensure changes applied for atomic file
	recoveryAtomicFile(dbPath);

	// Create DB
	const db = await open({
		filename: ':memory:',
		driver: ExtendedSqliteDatabase,
	}).then(async (db) => {
		// Setup extensions
		await db.loadExtension(path.join(dbExtensionsDir, 'uuid'));
		await db.loadExtension(path.join(dbExtensionsDir, 'dbdump'));

		if (existsSync(dbPath)) {
			// Load DB
			// TODO: implement decryption
			const dumpSQL = await readFile(dbPath, 'utf-8');
			await db.exec(dumpSQL);
			await migrateToLatestSchema(db as Database<ExtendedSqliteDatabase, sqlite3.Statement>);
		} else {
			// Setup pragma
			await db.exec(`PRAGMA main.user_version = ${latestSchemaVersion};`);

			// Create DB
			if (verboseLog) {
				console.info('Initialize DB');
				console.debug(setupSQL);
			}

			await db.exec(setupSQL);
		}

		return db as Database<ExtendedSqliteDatabase, sqlite3.Statement>;
	});

	type SyncRequest = {
		resolve(): void;
		reject(err: Error): void;
	};

	let syncRequests: SyncRequest[] = [];

	let isSyncWorkerRunned = false;
	const syncWorker = async () => {
		if (isSyncWorkerRunned) return;

		isSyncWorkerRunned = true;
		while (syncRequests.length > 0) {
			// Get requests to handle and flush array
			const syncRequestsInProgress = syncRequests;
			syncRequests = [];

			const rejectAll = (reason: Error) => {
				console.log('syncRequestsInProgress', syncRequestsInProgress);
				syncRequestsInProgress.forEach((syncRequest) =>
					syncRequest.reject(reason),
				);
			};

			// Create empty file if not exists
			// It needs to create proper lock file
			if (!existsSync(dbPath)) {
				await writeFile(dbPath, '');
			}

			// Exit if sync in progress
			const isLocked = await lockfileUtils.check(dbPath);
			if (isLocked) {
				// Reject requests
				rejectAll(new Error('DB file locked'));
				break;
			}

			const unlock = await lockfileUtils.lock(dbPath);

			// Dump pragma
			const pragmaNamesToDump = ['user_version'];
			const pragmasList = await Promise.all(pragmaNamesToDump.map((pragmaName) => db.get(`PRAGMA main.${pragmaName}`).then((response) => {
				if (!response) {
					throw new TypeError("Can't fetch pragma value");
				}

				const pragmaValue = response[pragmaName];
				return `PRAGMA main.${pragmaName} = ${pragmaValue};`;
			})));
			const pragmaDump = pragmasList.join('\n');

			// Dump data
			const retryDelay = 300;
			const retryDeadline = 1200;
			const startTime = performance.now();
			let dumpResponse: unknown | null = null;
			while ((performance.now() - startTime) <= retryDeadline) {
				try {
					dumpResponse = await db.get(`SELECT dbdump() as dump;`);
					break;
				} catch (err) {
					// Wait next tick, to free DB lock before dump data for some cases
					await new Promise((res) => setTimeout(res, retryDelay));
				}
			}

			if (!dumpResponse) {
				rejectAll(new Error("Cannot to get DB dump"));
				break;
			}

			const dataDump = (dumpResponse as any)['dump'];

			if (!dataDump) {
				const error = new Error('Dump are empty!');
				console.error(error);

				rejectAll(error);
				break;
			}

			const dumpString = [pragmaDump, dataDump].join('\n');

			// TODO: implement encryption before write

			// Write tmp file
			await writeFileAtomic(dbPath, dumpString);

			if (verboseLog) {
				console.info('DB saved');
				console.debug({ dumpString });
			}

			await unlock();

			// Resolve requests
			syncRequestsInProgress.forEach((syncRequest) => syncRequest.resolve());
		}

		isSyncWorkerRunned = false;
	};

	// Write changes to file
	const sync = () => {
		return new Promise<void>((resolve, reject) => {
			// Add task
			syncRequests.push({ resolve, reject });

			// Run worker if not started
			syncWorker();
		});
	};

	// Auto sync changes
	let isHaveChangesFromLastCommit = false;
	db.on('trace', async (command: string) => {
		if (verboseLog) {
			console.debug(command);
		}

		// Track changes
		const isMutableCommand = ['INSERT', 'UPDATE', 'DELETE', 'DROP'].some(
			(commandName) => command.startsWith(commandName),
		);
		if (isMutableCommand) {
			isHaveChangesFromLastCommit = true;
			await sync();
		}

		// Sync by transaction operations
		const isCommit = command.endsWith('COMMIT');
		if (isCommit && isHaveChangesFromLastCommit) {
			isHaveChangesFromLastCommit = false;
			await sync();
		}
	});

	const close = async () => {
		// Sync latest changes
		await sync();
		await db.close();
	};

	await sync();

	return {
		db,
		sync,
		close,
	};
};
