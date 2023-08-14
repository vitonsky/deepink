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

	public async getTags(): Promise<ITag[]> {
		const { db } = this.db;

		const rows = await db.all(tagsQuery);
		return rows.map(({ id, name, resolvedName, parent, }) => ({ id, name, resolvedName, parent: parent ?? null }));
	}
};