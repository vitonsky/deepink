import DB, { Database } from 'better-sqlite3';
import { existsSync } from 'fs';
import lockfileUtils from 'proper-lockfile';

import { recoveryAtomicFile, writeFileAtomic } from '../../utils/files';

import { IEncryptionController } from '../encryption';
import { readFile, writeFile } from 'fs/promises';
import { latestSchemaVersion, migrateToLatestSchema } from './migrations';
import setupSQL from './setup.sql';

export type SQLiteDb = {
	/**
	 * Configured database with extensions
	 */
	db: Database;

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

	/**
	 * Option to disable verbose logs
	 */
	verbose?: boolean;

	encryption?: IEncryptionController;
};

// TODO: add verbose logging
export const getDb = async ({
	dbPath,
	verbose: verboseLog = false,
	encryption,
}: Options): Promise<SQLiteDb> => {
	// Ensure changes applied for atomic file
	recoveryAtomicFile(dbPath);

	// Create DB
	let db: Database;
	if (existsSync(dbPath)) {
		// Load DB
		const rawDb = await readFile(dbPath);
		const sqlDump = encryption ? await encryption.decrypt(rawDb) : rawDb;

		// Check header signature, to detect a database file https://www.sqlite.org/fileformat.html#the_database_header
		const isDatabaseFile = sqlDump
			.toString('utf8', 0, 16)
			.startsWith(`SQLite format 3`);
		if (isDatabaseFile) {
			db = new DB(sqlDump);
		} else {
			// If no database file, load buffer as string with SQL commands
			db = new DB(':memory:');
			db.exec(sqlDump.toString());
		}

		await migrateToLatestSchema(db);
	} else {
		db = new DB(':memory:');
		// Setup pragma
		db.pragma(`main.user_version = ${latestSchemaVersion};`);

		// Create DB
		if (verboseLog) {
			console.info('Initialize DB');
			console.debug(setupSQL);
		}

		db.exec(setupSQL);

		// TODO: try to encrypt data. If does not work - fail
	}

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

			// Create empty file if not exists
			// It needs to create proper lock file
			if (!existsSync(dbPath)) {
				await writeFile(dbPath, '');
			}

			// Exit if sync in progress
			const isLocked = await lockfileUtils.check(dbPath);
			if (isLocked) {
				// Reject requests
				syncRequestsInProgress.forEach((syncRequest) =>
					syncRequest.reject(new Error('DB file locked')),
				);
				break;
			}

			const unlock = await lockfileUtils.lock(dbPath);

			// Wrap to allow throw exceptions for good control flow
			try {
				// Dump data
				const buffer = db.serialize();

				// Write tmp file
				const dbDump = encryption ? await encryption.encrypt(buffer) : buffer;
				await writeFileAtomic(dbPath, dbDump);

				if (verboseLog) {
					console.info('DB saved');
					console.debug({ dbDump });
				}

				await unlock();

				// Resolve requests
				syncRequestsInProgress.forEach((syncRequest) => syncRequest.resolve());
			} catch (err) {
				await unlock();

				const errorToThrow =
					err instanceof Error ? err : new Error('Unknown error');
				syncRequestsInProgress.forEach((syncRequest) =>
					syncRequest.reject(errorToThrow),
				);
			}
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

	// TODO: implement auto sync changes
	// Auto sync changes
	// let isHaveChangesFromLastCommit = false;
	// db.on('trace', async (command: string) => {
	// 	if (verboseLog) {
	// 		console.debug(command);
	// 	}

	// 	// Track changes
	// 	const isMutableCommand = ['INSERT', 'UPDATE', 'DELETE', 'DROP'].some(
	// 		(commandName) => command.includes(commandName),
	// 	);
	// 	if (isMutableCommand) {
	// 		isHaveChangesFromLastCommit = true;
	// 		await sync();
	// 	}

	// 	// Sync by transaction operations
	// 	const isCommit = command.endsWith('COMMIT');
	// 	if (isCommit && isHaveChangesFromLastCommit) {
	// 		isHaveChangesFromLastCommit = false;
	// 		await sync();
	// 	}
	// });

	const close = async () => {
		// Sync latest changes
		await sync();
		db.close();
	};

	await sync();

	return {
		db,
		sync,
		close,
	};
};
