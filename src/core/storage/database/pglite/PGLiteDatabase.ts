import { createEvent } from 'effector';
import { MigrationRunner } from 'ordinality/MigrationRunner';
import { IFileController } from '@core/features/files';
import { PGlite, PGliteOptions } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

import {
	IManagedDatabase,
	ManagedDatabase,
	Options as ManagedDatabaseOptions,
} from '../ManagedDatabase';
import { ExtendedPGLite } from './ExtendedPGLite';
import { ExtendedPGliteWorker } from './ExtendedPGliteWorker';
import { getMigrationsList } from './migrations';
import { PostgresMigrationsStorage } from './migrations/PostgresMigrationsStorage';
import { IDatabaseContainer } from '..';

export type PGLiteDatabaseContainer = IDatabaseContainer<ExtendedPGLite>;

export type PGLiteDatabase = IManagedDatabase<ExtendedPGLite>;

export type Options = ManagedDatabaseOptions & {
	verboseLog?: boolean;
};

export const IN_NODE =
	typeof process === 'object' &&
	typeof process.versions === 'object' &&
	typeof process.versions.node === 'string';

export const getPGLiteInstance = async (options: PGliteOptions) => {
	console.log({ IN_NODE });
	if (IN_NODE) {
		return new ExtendedPGLite({
			...options,
			extensions: { pg_trgm },
		}) as unknown as ExtendedPGliteWorker;
	} else {
		const DBWorker = await import('./PGLite.worker').then(
			(module: any) => module.default,
		);

		return new ExtendedPGliteWorker(new DBWorker(), options);
	}
};

// TODO: fix types. Introduce common type to use in app
export const getWrappedDb = async (
	dbFile: IFileController,
	{ verboseLog }: Options = {},
): Promise<PGLiteDatabaseContainer> => {
	const onChanged = createEvent();

	// TODO: attach to a DB
	// Create DB
	let db: ExtendedPGliteWorker;

	const dbFileBuffer = await dbFile.get();

	if (dbFileBuffer && dbFileBuffer.byteLength > 0) {
		// Load DB

		db = await getPGLiteInstance({
			loadDataDir: new Blob([dbFileBuffer]),
		});
	} else {
		db = await getPGLiteInstance({});
	}
	await db.waitReady;

	// Migrate data
	const context = { db: db as unknown as PGlite };
	const migrations = new MigrationRunner({
		storage: new PostgresMigrationsStorage(db),
		migrations: await getMigrationsList(),
		context,
	});

	// Run migrations with hooks for recovery mode
	while (true) {
		try {
			if (verboseLog) {
				console.debug(
					'Executed migrations',
					(await migrations.executed()).join(', '),
				);
				console.debug(
					'Migrations to apply',
					(await migrations.executed()).join(', '),
				);
			}

			const executedMigrations = await migrations.up();

			if (verboseLog) {
				console.debug('Executed migrations', executedMigrations);
			}
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
	db.on('sync', () => {
		// Skip for closed DB
		if (db.closed) return;

		onChanged();
	});

	const dumpData = async () =>
		db.dumpDataDir('none').then((file) => file.arrayBuffer());

	// Write latest data
	dbFile.write(await dumpData());

	return {
		onChanged,
		getDatabase() {
			// TODO: fix types
			return db as unknown as ExtendedPGLite;
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
