import DB, { Database } from 'better-sqlite3';
import { createEvent, Event } from 'effector';
import { IFileController } from '@core/features/files';
import { debounce } from '@utils/debounce/debounce';

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

	sync?: {
		delay: number;
		deadline: number;
	};
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

type SyncRequest = {
	resolve(): void;
	reject(err: Error): void;
};

export class ManagedDatabase implements SQLiteDatabase {
	public readonly db: Database;
	public readonly onChanged;
	private readonly dbFile: IFileController;
	private readonly options;
	private readonly debouncedSync;
	constructor(
		{
			db,
			onChanged,
		}: {
			db: Database;
			onChanged: Event<void>;
		},
		dbFile: IFileController,
		options: Options = {},
	) {
		this.db = db;
		this.onChanged = onChanged;
		this.dbFile = dbFile;
		this.options = options;

		// Auto sync changes
		const sync = options.sync ?? { delay: 300, deadline: 800 };
		this.debouncedSync = debounce(
			() => {
				console.warn('Debounced sync');
				this.sync();
			},
			{ wait: sync.delay, deadline: sync.deadline },
		);

		onChanged.watch(this.debouncedSync);
	}

	private syncRequests: SyncRequest[] = [];

	private isSyncWorkerRun = false;
	private syncWorker = async () => {
		const { encryption, verbose } = this.options;

		if (this.isSyncWorkerRun) return;

		this.isSyncWorkerRun = true;
		while (this.syncRequests.length > 0) {
			// Get requests to handle and flush array
			const syncRequestsInProgress = this.syncRequests;
			this.syncRequests = [];

			// Control execution and forward exceptions to promises
			try {
				console.log('DBG: dump...');
				// Dump data
				const buffer = await waitDatabaseLock(() => this.db.serialize());

				console.log('DBG: write file...');
				// Write file
				const dbDump = encryption ? await encryption.encrypt(buffer) : buffer;
				await this.dbFile.write(dbDump);

				if (verbose) {
					console.info('DB saved');
					console.debug({ dbDump });
				}

				console.log('DBG: resolve...');
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

		this.isSyncWorkerRun = false;
	};

	// Update database file
	public sync = () => {
		if (!this.db.open) throw new Error('Database are closed');

		return new Promise<void>((resolve, reject) => {
			console.warn('Sync call');
			// Add task
			this.syncRequests.push({ resolve, reject });

			// Run worker if not started
			this.syncWorker();
		});
	};

	public close = async () => {
		// Sync latest changes
		this.debouncedSync.cancel();

		// TODO: FIXME:
		await this.sync();

		await waitDatabaseLock(() => this.db.close());
	};
}

export const getWrappedDb = async (
	dbFile: IFileController,
	{ verbose: verboseLog = false, encryption }: Options = {},
) => {
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

			const sqlText = new TextDecoder().decode(dumpBuffer);
			db.exec(sqlText);
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

	const onChanged = createEvent();
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
			onChanged();
		}
	});

	return { db, onChanged };
};

export const openDatabase = async (
	dbFile: IFileController,
	options: Options = {},
): Promise<SQLiteDatabase> => {
	const wrappedDb = await getWrappedDb(dbFile, options);
	const managedDb = new ManagedDatabase(wrappedDb, dbFile, options);

	await managedDb.sync();

	return managedDb;
};
