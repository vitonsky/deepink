import { wrap } from 'comlink';
import { BindParams } from 'sql.js';

import SQLWorker from './SQLiteDatabase.worker';
import { SQLiteDB, SQLiteDBWorker } from '.';

export class SQLiteDatabaseWorker implements SQLiteDB {
	protected db;
	constructor(data?: ArrayLike<number> | Buffer | null) {
		const db = wrap<SQLiteDBWorker>(new SQLWorker());
		this.db = db.init(data).then(() => db);
	}

	async query(query: string, params?: BindParams) {
		const db = await this.db;
		return db.query(query, params);
	}

	async export() {
		const db = await this.db;
		return db.export();
	}

	async close() {
		const db = await this.db;
		return db.close();
	}
}
