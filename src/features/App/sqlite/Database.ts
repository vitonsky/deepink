import sqlite, { ParamsObject, QueryExecResult } from 'sql.js';

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

export class Database implements SQLiteDB {
	protected db: Promise<sqlite.Database> | null = null;
	protected async getDB() {
		if (!this.db) {
			this.db = loadSQLite().then((sqlite) => new sqlite.Database());
		}

		return this.db;
	}

	async query(
		query: string,
		params?: sqlite.BindParams,
	): Promise<sqlite.ParamsObject[]> {
		const db = await this.getDB();

		const result = db.exec(query, params);

		return queryResultsToParams(result);
	}
}
