import { Endpoint, expose, proxy } from 'comlink';

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
		export(...args) {
			if (!db)
				throw new Error(
					'Database instance is not created yet. Call init() first',
				);
			return db.export(...args);
		},
		close(...args) {
			if (!db)
				throw new Error(
					'Database instance is not created yet. Call init() first',
				);
			return db.close(...args);
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
