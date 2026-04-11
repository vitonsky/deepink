import sqlite, { UpdateHookCallback } from 'sql.js';

export interface SQLiteDB {
	query(query: string, params?: sqlite.BindParams): Promise<sqlite.ParamsObject[]>;
	export(): Promise<Uint8Array>;
	close(): Promise<void>;
	onChange(callback: UpdateHookCallback): () => void;
}

export interface SQLiteDBWorker extends SQLiteDB {
	init(data?: ArrayLike<number> | Buffer | null): Promise<void>;
}
