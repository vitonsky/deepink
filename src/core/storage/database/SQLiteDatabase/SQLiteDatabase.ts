import DB, { Database } from 'better-sqlite3';
import debounce from 'debounce';
import { IFileController } from '@core/features/files';

import { IEncryptionController } from '../../../encryption';

import { latestSchemaVersion, migrateToLatestSchema } from './migrations';
import setupSQL from './setup.sql';

export type SQLiteDatabase = {
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
	/**
	 * Option to disable verbose logs
	 */
	verbose?: boolean;

	encryption?: IEncryptionController;
};

export const waitDatabaseLock = async <T = void>(callback: () => T, timeout = 5000) => {
	const startTime = new Date().getTime();

	return new Promise<T>((res, rej) => {
		const tryExecute = () => {
			try {
				const result = callback();
				res(result);
				return;
			} catch (error) {
				if (
					typeof error === 'object' &&
					(error as Error).message ===
						'This database connection is busy executing a query'
				) {
					if (new Date().getTime() - startTime < timeout) {
						setTimeout(tryExecute, 10);
					} else {
						rej(error);
					}
				} else {
					rej(error);
				}
			}
		};

		tryExecute();
	});
};

export const openDatabase = async (
	dbFile: IFileController,
	{ verbose: verboseLog = false, encryption }: Options = {},
): Promise<SQLiteDatabase> => {
	// Create DB
	let db: Database;
	const tracingCallbacks: Array<(command: string) => void> = [];
	const dbOptions = {
		// We use this way, because loader can't automatically find a native module
		nativeBinding:
			require('better-sqlite3/build/Release/better_sqlite3.node') as string,
		verbose: (message?: unknown, ..._additionalArgs: unknown[]) => {
			if (typeof message !== 'string') return;
			tracingCallbacks.forEach((cb) => cb(message));
		},
	};

	const dbFileBuffer = await dbFile.get();
	if (dbFileBuffer && dbFileBuffer.byteLength > 0) {
		// Load DB
		const dumpBuffer = encryption
			? await encryption.decrypt(dbFileBuffer)
			: dbFileBuffer;

		// Check header signature, to detect a database file https://www.sqlite.org/fileformat.html#the_database_header
		const isDatabaseFile = new TextDecoder()
			.decode(dumpBuffer.slice(0, 16))
			.startsWith(`SQLite format 3`);
		if (isDatabaseFile) {
			db = new DB(Buffer.from(dumpBuffer), dbOptions);
		} else {
			// If no database file, load buffer as string with SQL commands
			db = new DB(':memory:', dbOptions);
			db.exec(dumpBuffer.toString());
		}

		// Migrate data
		await migrateToLatestSchema(db, verboseLog);
	} else {
		db = new DB(':memory:', dbOptions);

		// Setup pragma
		db.pragma(`main.user_version = ${latestSchemaVersion};`);

		// Create DB
		if (verboseLog) {
			console.info('Initialize DB');
			console.debug(setupSQL);
		}

		db.exec(setupSQL);
	}

	type SyncRequest = {
		resolve(): void;
		reject(err: Error): void;
	};

	let syncRequests: SyncRequest[] = [];

	let isSyncWorkerRun = false;
	const syncWorker = async () => {
		if (isSyncWorkerRun) return;

		isSyncWorkerRun = true;
		while (syncRequests.length > 0) {
			// Get requests to handle and flush array
			const syncRequestsInProgress = syncRequests;
			syncRequests = [];

			// Control execution and forward exceptions to promises
			try {
				// Dump data
				const buffer = await waitDatabaseLock(() => db.serialize());

				// Write file
				const dbDump = encryption ? await encryption.encrypt(buffer) : buffer;
				await dbFile.write(dbDump);

				if (verboseLog) {
					console.info('DB saved');
					console.debug({ dbDump });
				}

				// Resolve requests
				syncRequestsInProgress.forEach((syncRequest) => syncRequest.resolve());
			} catch (err) {
				const errorToThrow =
					err instanceof Error ? err : new Error('Unknown error');
				syncRequestsInProgress.forEach((syncRequest) =>
					syncRequest.reject(errorToThrow),
				);
			}
		}

		isSyncWorkerRun = false;
	};

	// Update database file
	const sync = () => {
		if (!db.open) throw new Error('Database are closed');

		return new Promise<void>((resolve, reject) => {
			// Add task
			syncRequests.push({ resolve, reject });

			// Run worker if not started
			syncWorker();
		});
	};

	// Auto sync changes
	const debouncedSync = debounce(sync, 10000);
	let isHaveChangesFromLastCommit = false;
	tracingCallbacks.push(async (command: string) => {
		// Skip for closed DB
		if (!db.open) return;

		if (verboseLog) {
			console.debug(command);
		}

		// Track changes
		const isMutableCommand = ['INSERT', 'UPDATE', 'DELETE', 'DROP'].some(
			(commandName) => command.includes(commandName),
		);
		if (isMutableCommand) {
			isHaveChangesFromLastCommit = true;
			await debouncedSync();
		}

		// Sync by transaction operations
		const isCommit = command.endsWith('COMMIT');
		if (isCommit && isHaveChangesFromLastCommit) {
			isHaveChangesFromLastCommit = false;
			await debouncedSync();
		}
	});

	const close = async () => {
		// Sync latest changes
		debouncedSync.clear();
		await sync();

		await waitDatabaseLock(() => db.close());
	};

	await sync();

	return {
		db,
		sync,
		close,
	};
};
