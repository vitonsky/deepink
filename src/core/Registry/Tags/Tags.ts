import { SQLiteDb } from "../../storage/SQLiteDb";

export type ITag = {
	id: string;
	/**
	 * Tag name
	 */
	name: string;
	/**
	 * Tag name with full path like `foo/bar/baz`
	 */
	resolvedName: string;
	/**
	 * Id of parent tag
	 */
	parent: string | null;
};

const tagsQuery = `
WITH RECURSIVE tagTree AS (
	SELECT
		id, parent, name, 1 AS segmentId, id AS tagTreeId
	FROM tags
	UNION ALL
	SELECT
		t2.id, t.parent, t.name, t2.segmentId + 1 AS segmentId, t2.tagTreeId AS tagTreeId
	FROM tags t
	INNER JOIN tagTree t2
	ON t.id = t2.parent
)
SELECT
	t.id, t.name, x.name as resolvedName, t.parent
FROM tags t
INNER JOIN (
	SELECT id, group_concat(name, "/") AS name
	FROM (
		SELECT * FROM tagTree ORDER BY segmentId DESC
	)
	GROUP BY tagTreeId
) x
ON t.id = x.id
`;

export class Tags {
	private db;
	constructor(db: SQLiteDb) {
		this.db = db;
	}

	/**
	 * Returns tags  list
	 */
	public async getTags(): Promise<ITag[]> {
		const { db } = this.db;

		const rows = await db.all(tagsQuery);
		return rows.map(({ id, name, resolvedName, parent, }) => ({ id, name, resolvedName, parent: parent ?? null }));
	}

	public async add(name: string, parent: null | string): Promise<string> {
		const { db } = this.db;

		const insertResult = await db.run('INSERT INTO tags ("id", "name", "parent") VALUES (uuid4(), ?, ?)', [name, parent]);

		// Get generated id
		const selectWithId = await db.get(
			'SELECT `id` FROM tags WHERE rowid=?',
			insertResult.lastID,
		);
		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		return selectWithId.id;
	}

	/**
	 * Returns tags attached to a entity
	 */
	public async getAttachedTags(target: string): Promise<ITag[]> {
		const { db } = this.db;

		const query = [tagsQuery, `WHERE t.id IN (SELECT source FROM attachedTags WHERE target = ?)`].join(' ');
		const rows = await db.all(query, [target]);
		return rows.map(({ id, name, resolvedName, parent, }) => ({ id, name, resolvedName, parent: parent ?? null }));
	}
};