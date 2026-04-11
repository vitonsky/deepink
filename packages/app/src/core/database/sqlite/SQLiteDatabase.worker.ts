import { Endpoint, expose, proxy, transfer } from 'comlink';

import { SQLiteDatabase } from './SQLiteDatabase';
import { SQLiteDBWorker } from '.';

let db: SQLiteDatabase | null = null;

expose(
	{
		async init(data) {
			// Close previous instance
			if (db) await db.close();

			db = new SQLiteDatabase(data);

			// Add debug endpoints
			(self as any).db = db;
		},
		query(...args) {
			if (!db)
				throw new Error(
					'Database instance is not created yet. Call init() first',
				);
			return db.query(...args);
		},
		async export() {
			if (!db)
				throw new Error(
					'Database instance is not created yet. Call init() first',
				);

			const dump = await db.export();
			return transfer(dump, [dump.buffer]);
		},
		async close() {
			if (!db)
				throw new Error(
					'Database instance is not created yet. Call init() first',
				);

			const currentDb = db;
			db = null;
			await currentDb.close();
		},
		onChange(callback) {
			if (!db)
				throw new Error(
					'Database instance is not created yet. Call init() first',
				);
			return proxy(db.onChange(callback));
		},
	} satisfies SQLiteDBWorker,
	self as Endpoint,
);
