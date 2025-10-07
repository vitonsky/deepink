import { createEvent } from 'effector';
import { IFileController } from '@core/features/files';

import {
	IManagedDatabase,
	ManagedDatabase,
	Options as ManagedDatabaseOptions,
} from '../ManagedDatabase';
import { EventsMap, ExtendedPGLite } from './ExtendedPGLite';
import setupSQL from './setup.sql';
import { IDatabaseContainer } from '..';

export type PGLiteDatabaseContainer = IDatabaseContainer<ExtendedPGLite>;

export type PGLiteDatabase = IManagedDatabase<ExtendedPGLite>;

export type Options = ManagedDatabaseOptions & {
	verboseLog?: boolean;
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
		db = new ExtendedPGLite({ loadDataDir: new Blob([dbFileBuffer]) });
		await db.waitReady;

		// TODO: Migrate data
	} else {
		db = new ExtendedPGLite();
		await db.waitReady;

		// Create DB
		if (verboseLog) {
			console.info('Initialize DB');
			console.debug(setupSQL);
		}

		db.exec(setupSQL);
	}

	db.on('command', onCommand);

	const dumpData = async () => {
		const buffer = await waitDatabaseLock(() =>
			db.dumpDataDir('none').then((file) => file.arrayBuffer()),
		);

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
