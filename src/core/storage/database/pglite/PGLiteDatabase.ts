import { createEvent } from 'effector';
import { IFileController } from '@core/features/files';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

import {
	IManagedDatabase,
	ManagedDatabase,
	Options as ManagedDatabaseOptions,
} from '../ManagedDatabase';
import { EventsMap, ExtendedPGLite } from './ExtendedPGLite';
import { getMigrationsList } from './migrations';
import { MigrationsRunner } from './migrations/MigrationsRunner';
import { PostgresMigrationsStorage } from './migrations/PostgresMigrationsStorage';
import { IDatabaseContainer } from '..';

export type PGLiteDatabaseContainer = IDatabaseContainer<ExtendedPGLite>;

export type PGLiteDatabase = IManagedDatabase<ExtendedPGLite>;

export type Options = ManagedDatabaseOptions & {
	verboseLog?: boolean;
};

export const getWrappedDb = async (
	dbFile: IFileController,
	{ verboseLog }: Options = {},
): Promise<PGLiteDatabaseContainer> => {
	const onChanged = createEvent();

	const mutableCommands = [
		'INSERT',
		'UPDATE',
		'DELETE',
		'REPLACE',
		'CREATE TABLE',
		'CREATE INDEX',
		'CREATE VIEW',
		'CREATE TRIGGER',
		'DROP TABLE',
		'DROP INDEX',
		'DROP VIEW',
		'DROP TRIGGER',
		'ALTER TABLE',
		'PRAGMA',
	];

	// Create DB
	let db: ExtendedPGLite;
	const onCommand = ({ command, affectedRows }: EventsMap['command']) => {
		if (typeof command !== 'string') return;

		// Skip for closed DB
		if (db.closed) return;

		if (verboseLog) {
			console.debug(command);
		}

		// Track mutable changes
		const capitalizedCommand = command.toUpperCase();
		if (
			(affectedRows === undefined || affectedRows > 0) &&
			mutableCommands.some((commandName) =>
				capitalizedCommand.includes(commandName),
			)
		) {
			onChanged();
		}
	};

	const dbFileBuffer = await dbFile.get();
	if (dbFileBuffer && dbFileBuffer.byteLength > 0) {
		// Load DB
		db = new ExtendedPGLite({
			loadDataDir: new Blob([dbFileBuffer]),
			extensions: { pg_trgm },
		});
	} else {
		db = new ExtendedPGLite({ extensions: { pg_trgm } });
	}
	await db.waitReady;

	// Migrate data
	const context = { db };
	const migrations = new MigrationsRunner({
		storage: new PostgresMigrationsStorage(),
		migrations: await getMigrationsList(),
		context,
		logger: console,
	});

	// Run migrations with hooks for recovery mode
	while (true) {
		try {
			await migrations.up();
			break;
		} catch (error) {
			const isRecoveryMode =
				typeof globalThis.localStorage !== 'undefined' &&
				localStorage.getItem('recovery_mode') === 'true';

			if (!isRecoveryMode) {
				// Clear DB from context
				// With no this code, tests freezes while errors
				// Probably this is because wasm code can't make free due to references
				delete (context as any)['db'];
				throw error;
			}

			console.error(error);

			await new Promise((resolve, reject) => {
				const recoveryControls = {
					db,
					resolve,
					reject() {
						reject(error);
					},
				};

				(globalThis as any)['__recovery'] = recoveryControls;
				console.log(
					"Recovery mode is enabled. Call `resolve` once you've done with fix database or call `reject` to exit of recovery mode",
					recoveryControls,
				);
			});

			console.log('Recovery is completed. Apply migrations again...');
		}
	}

	// Configure DB
	db.on('command', onCommand);

	const dumpData = async () => {
		const buffer = await db.dumpDataDir('none').then((file) => file.arrayBuffer());
		return Buffer.from(new Uint8Array(buffer));
	};

	// Write latest data
	dbFile.write(await dumpData());

	return {
		onChanged,
		getDatabase() {
			return db;
		},
		isOpened() {
			return !db.closed;
		},
		getData() {
			return dumpData();
		},
		close() {
			return db.close();
		},
	};
};

export const openDatabase = async (
	dbFile: IFileController,
	options: Options = {},
): Promise<PGLiteDatabase> => {
	const wrappedDb = await getWrappedDb(dbFile, options);
	return new ManagedDatabase(wrappedDb, dbFile, options);
};
