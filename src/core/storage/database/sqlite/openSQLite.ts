import { createEvent } from 'effector';
import { IFileController } from '@core/features/files';

import { ManagedDatabase } from '../ManagedDatabase';
import scheme from './scheme.sql';
import { SQLiteDB } from '.';

export const openSQLite = async (file: IFileController) => {
	const initBuffer = await file
		.get()
		.then((buffer) => (buffer ? new Uint8Array(buffer) : null));

	const isNode = typeof process !== 'undefined';
	const db = isNode
		? await import('./SQLiteDatabase').then(async ({ SQLiteDatabase }) => {
				return new SQLiteDatabase(initBuffer);
			})
		: await import('./SQLiteDatabaseWorker').then(
				async ({ SQLiteDatabaseWorker }) => {
					return new SQLiteDatabaseWorker(initBuffer);
				},
			);

	// TODO: run migrations
	if (initBuffer === null) {
		await db.query(scheme);
	}

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
