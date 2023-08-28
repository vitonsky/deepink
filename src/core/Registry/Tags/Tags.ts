import { DeclarativeStatement } from "../../storage/ExtendedSqliteDatabase";
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

		let lastId: number;

		const segments = name.split('/');
		if (segments.length > 1) {
			const results = await db.getDatabaseInstance().runBatch(segments.map((name, idx) => {
				const isFirstItem = idx === 0;

				if (isFirstItem) {
					return {
						sql: 'INSERT INTO tags ("id", "name", "parent") VALUES (uuid4(), ?, ?)',
						params: [name, parent]
					};
				}

				return {
					sql: 'INSERT INTO tags ("id", "name", "parent") VALUES (uuid4(), ?, (SELECT id FROM tags WHERE ROWID=last_insert_rowid()))',
					params: [name]
				};
			}));

			lastId = results[0].lastID;
		} else {
			const insertResult = await db.run('INSERT INTO tags ("id", "name", "parent") VALUES (uuid4(), ?, ?)', [name, parent]);
			if (insertResult.lastID === undefined) {
				throw new Error("Last insert id not found");
			}

			lastId = insertResult.lastID;
		}

		// Get generated id
		const selectWithId = await db.get(
			'SELECT `id` FROM tags WHERE rowid=?',
			lastId,
		);
		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		return selectWithId.id;
	}

	public async update(tag: { id: string; name: string; parent: null | string }): Promise<void> {
		const { db } = this.db;

		await db.run('UPDATE tags SET name=?, parent=? WHERE id=?', [tag.name, tag.parent, tag.id]);
	}

	public async delete(id: string): Promise<void> {
		const { db } = this.db;

		// TODO: remove associations
		await db.run(`
			WITH RECURSIVE tagTree AS (
				SELECT
					id, parent, name, id AS root
				FROM tags
				UNION ALL
				SELECT
					t.id, t.parent, t.name, t2.root
				FROM tags t
				INNER JOIN tagTree t2
				ON t.parent = t2.id
			)
			DELETE FROM tags WHERE id IN (SELECT id FROM tagTree WHERE root IN (?) GROUP BY id)
		`, [id]);
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

	public async setAttachedTags(target: string, tags: string[]): Promise<void> {
		const { db } = this.db;

		const query: DeclarativeStatement[] = [
			{
				sql: `DELETE FROM attachedTags WHERE target=?`,
				params: [target]
			}
		];

		if (tags.length > 0) {
			query.push({
				sql: `INSERT INTO attachedTags(id,source,target) VALUES ${Array(tags.length).fill('(uuid4(), ?, ?)').join(',')}`,
				params: tags.map((tagId) => [tagId, target]).flat()
			});
		}

		await db.getDatabaseInstance().runBatch(query);
	}
};