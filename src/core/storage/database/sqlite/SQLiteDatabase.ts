import sqlite, { ParamsObject, QueryExecResult } from 'sql.js';
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
	console.log('WASM path', sqliteWasmUrl);

	return sqlite({ locateFile: () => sqliteWasmUrl });
};

export class SQLiteDatabase implements SQLiteDB {
	protected db;
	constructor(data?: ArrayLike<number> | Buffer | null) {
		this.db = loadSQLite().then((sqlite) => {
			const db = new sqlite.Database(data);

			db.create_function('gen_random_uuid', () => uuidv4());
			db.create_function('now', () => new Date().toISOString());

			return db;
		});
	}

	async export() {
		const db = await this.db;
		return db.export();
	}

	async close() {
		const db = await this.db;
		db.close();
	}

	async query(
		query: string,
		params?: sqlite.BindParams,
	): Promise<sqlite.ParamsObject[]> {
		const db = await this.db;

		const result = db.exec(query, params);

		return queryResultsToParams(result);
	}
}
