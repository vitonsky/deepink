import { createEvent } from 'effector';
import { MigrationRunner } from 'ordinality/MigrationRunner';
import { IFileController } from '@core/features/files';

import { ManagedDatabase } from '../ManagedDatabase';
import { getMigrationsList } from './migrations';
import { SQLiteMigrationsStorage } from './migrations/SQLiteMigrationsStorage';
import { SQLiteDatabaseWorker } from './SQLiteDatabaseWorker';
import { SQLiteDB } from '.';

export const openSQLite = async (file: IFileController) => {
	const initBuffer = await file.get();
	const db = new SQLiteDatabaseWorker(initBuffer);

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
