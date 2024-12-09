import DB, { Database } from 'better-sqlite3';
import { createEvent } from 'effector';
import { IFileController } from '@core/features/files';

import {
	IManagedDatabase,
	ManagedDatabase,
	Options as ManagedDatabaseOptions,
} from '../ManagedDatabase';
import { latestSchemaVersion, migrateToLatestSchema } from './migrations';
import setupSQL from './setup.sql';
import { IDatabaseContainer } from '..';

export type SQLiteDatabaseContainer = IDatabaseContainer<Database>;

export type SQLiteDatabase = IManagedDatabase<Database>;

export type Options = ManagedDatabaseOptions & {
	/**
	 * Option to disable verbose logs
	 */
	verbose?: boolean;
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

export const getWrappedDb = async (
	dbFile: IFileController,
	{ verbose: verboseLog = false }: Options = {},
): Promise<SQLiteDatabaseContainer> => {
	const onChanged = createEvent();

	// Create DB
	let db: Database;
	const dbOptions = {
		// We use this way, because loader can't automatically find a native module
		nativeBinding:
			require('better-sqlite3/build/Release/better_sqlite3.node') as string,
		verbose: (command?: unknown, ..._additionalArgs: unknown[]) => {
			if (typeof command !== 'string') return;

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
		},
	};

	const dbFileBuffer = await dbFile.get();
	if (dbFileBuffer && dbFileBuffer.byteLength > 0) {
		// Load DB
		// Check header signature, to detect a database file https://www.sqlite.org/fileformat.html#the_database_header
		const isDatabaseFile = new TextDecoder()
			.decode(dbFileBuffer.slice(0, 16))
			.startsWith(`SQLite format 3`);
		if (isDatabaseFile) {
			db = new DB(Buffer.from(dbFileBuffer), dbOptions);
		} else {
			// If no database file, load buffer as string with SQL commands
			db = new DB(':memory:', dbOptions);

			const sqlText = new TextDecoder().decode(dbFileBuffer);
			db.exec(sqlText);
		}

		// Migrate data
		await migrateToLatestSchema(db, verboseLog);
	} else {
		// Create new DB
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

	const dumpData = () => waitDatabaseLock(() => db.serialize());

	// Write latest data
	dbFile.write(await dumpData());

	return {
		onChanged,
		getDatabase() {
			return db;
		},
		isOpened() {
			return db.open;
		},
		getData() {
			return dumpData();
		},
		close() {
			return waitDatabaseLock(() => {
				db.close();
			});
		},
	};
};

export const openDatabase = async (
	dbFile: IFileController,
	options: Options = {},
): Promise<SQLiteDatabase> => {
	const wrappedDb = await getWrappedDb(dbFile, options);
	return new ManagedDatabase(wrappedDb, dbFile, options);
};
