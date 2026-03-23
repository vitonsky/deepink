import sqlite, { Database, ParamsObject, QueryExecResult } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';

import { SQLiteDB } from '.';

export function queryResultsToParams(results: QueryExecResult[]): ParamsObject[] {
	const allRows: ParamsObject[] = [];

	for (const result of results) {
		const { columns, values } = result;
		if (!columns || !values) continue;

		for (const row of values) {
			const obj: ParamsObject = {};
			row.forEach((val, idx) => {
				obj[columns[idx]] = val;
			});
			allRows.push(obj);
		}
	}

	return allRows;
}

const loadSQLite = async () => {
	if (typeof process !== 'undefined') return sqlite();

	const { default: sqliteWasmUrl } = await import('sql.js/dist/sql-wasm.wasm');
	return sqlite({ locateFile: () => sqliteWasmUrl });
};

export class SQLiteDatabase implements SQLiteDB {
	protected db;
	constructor(data?: ArrayLike<number> | Buffer | null) {
		this.db = loadSQLite().then((sqlite) => {
			const db = new sqlite.Database(data);
			this.applyConfig(db);

			return db;
		});
	}

	protected applyConfig(db: Database) {
		db.exec('PRAGMA foreign_keys = ON;');

		// Notify updates
		db.updateHook((operation, database, table, rowId) => {
			this.onChangeCallbacks.forEach((callback) =>
				callback(operation, database, table, rowId),
			);
		});

		// Custom functions
		db.create_function('gen_random_uuid', () => uuidv4());
		db.create_function('now', () => new Date().toISOString());
		db.create_function('timestamp', (date: string) =>
			(date && date !== 'now' ? new Date(date) : new Date()).getTime(),
		);
	}

	async export() {
		const db = await this.db;
		const data = db.export();

		// Restore config
		this.applyConfig(db);

		return data;
	}

	protected isClosed = false;
	async close() {
		if (this.isClosed) return;

		this.isClosed = true;
		const db = await this.db;
		db.close();
	}

	async query(
		query: string,
		params?: sqlite.BindParams,
	): Promise<sqlite.ParamsObject[]> {
		if (this.isClosed) throw new Error('Database is closed');

		const db = await this.db;

		try {
			const result = db.exec(query, params);

			return queryResultsToParams(result);
		} catch (error) {
			console.debug(query);
			throw error;
		}
	}

	private readonly onChangeCallbacks = new Set<sqlite.UpdateHookCallback>();
	onChange(callback: sqlite.UpdateHookCallback) {
		this.onChangeCallbacks.add(callback);
		return () => {
			this.onChangeCallbacks.delete(callback);
		};
	}
}
