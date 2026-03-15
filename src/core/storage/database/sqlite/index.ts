import type sqlite from 'sql.js';

export interface SQLiteDB {
	query(query: string, params?: sqlite.BindParams): Promise<sqlite.ParamsObject[]>;
	export(): Promise<Uint8Array>;
	close(): Promise<void>;
}
