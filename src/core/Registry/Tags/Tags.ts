import { SQLiteDb } from "../../storage/SQLiteDb";

export type ITag = {
	id: string;
	name: string;
	parent: string | null;
};

/**
 * Tag with resolved name (name with nesting like `foo/bar/baz`)
 */
export type IResolvedTag = {
	id: string;
	/**
	 * Full tag name like `foo/bar/baz`
	 */
	name: string;
};

export class Tags {
	private db;
	constructor(db: SQLiteDb) {
		this.db = db;
	}

	public async getTags(): Promise<ITag[]> {
		const { db } = this.db;

		const rows = await db.all('SELECT * FROM tags');
		return rows.map(({ id, name, parent }) => ({ id, name, parent: parent ?? null }));
	}

	public async getResolvedTags(): Promise<IResolvedTag[]> {
		const { db } = this.db;

		const rows = await db.all(`WITH RECURSIVE tagTree AS (
			SELECT id, parent, name, 1 AS segmentNum, id AS tagTreeId FROM tags
			UNION ALL
			SELECT t2.id, t.parent, t.name, t2.segmentNum + 1 AS segmentNum, t2.tagTreeId AS tagTreeId FROM tags t INNER JOIN tagTree t2 ON (t.id = t2.parent)
		)
		
		SELECT id, group_concat(name, "/") AS name FROM (SELECT * FROM tagTree ORDER BY segmentNum DESC) GROUP BY tagTreeId`);
		return rows;
	}
};