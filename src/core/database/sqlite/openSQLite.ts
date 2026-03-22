import { createEvent } from 'effector';
import { MigrationRunner } from 'ordinality';
import { IFileController } from '@core/features/files';

import { ManagedDatabase } from '../ManagedDatabase';
import { getMigrationsList } from './migrations';
import { SQLiteMigrationsStorage } from './migrations/SQLiteMigrationsStorage';
import { SQLiteDB } from '.';

export const openSQLite = async (file: IFileController) => {
	const initBuffer = await file.get();

	const isNode = typeof process !== 'undefined';
	const db = isNode
		? await import('./SQLiteDatabase').then(async ({ SQLiteDatabase }) => {
				return new SQLiteDatabase(initBuffer ? new Uint8Array(initBuffer) : null);
			})
		: await import('./SQLiteDatabaseWorker').then(
				async ({ SQLiteDatabaseWorker }) => {
					return new SQLiteDatabaseWorker(initBuffer);
				},
			);

	// Migrate data
	const migrations = new MigrationRunner({
		context: { db },
		storage: new SQLiteMigrationsStorage(db),
		migrations: await getMigrationsList(),
	});

	await migrations.up();

	const onChanged = createEvent();
	db.onChange(() => onChanged());

	let isOpened = true;
	return new ManagedDatabase<SQLiteDB>(
		{
			getDatabase() {
				return db;
			},
			async getData() {
				const data = await db.export();
				return data.buffer as ArrayBuffer;
			},

			isOpened() {
				return isOpened;
			},
			close() {
				isOpened = false;
				return db.close();
			},
			onChanged: onChanged,
		},
		file,
	);
};
