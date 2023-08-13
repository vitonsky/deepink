import { SQLiteDb } from "../../storage/SQLiteDb";

export type ITag = {
	id: string;
	name: string;
	parent: string | null;
};

export class Tags {
	private db;
	constructor(db: SQLiteDb) {
		this.db = db;
	}

	public async get(): Promise<ITag[]> {
		const { db } = this.db;

		const rows = await db.all('SELECT * FROM tags');
		return rows.map(({ id, name, parent }) => ({ id, name, parent: parent ?? null }));
	}
};