import { v4 as uuid4 } from 'uuid';

import { SQLiteDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

export type ITagData = {
	id: string;
	/**
	 * Tag name
	 */
	name: string;
	/**
	 * Id of parent tag
	 */
	parent: string | null;
};

export type ITag = ITagData & {
	/**
	 * Tag name with full path like `foo/bar/baz`
	 */
	resolvedName: string;
};

/**
 * Query to select tags with resolved name (like `foo/bar/baz`)
 */
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
	SELECT id, group_concat(name, '/') AS name
	FROM (
		SELECT * FROM tagTree ORDER BY segmentId DESC
	)
	GROUP BY tagTreeId
) x
ON t.id = x.id
`;

export class Tags {
	private db;
	constructor(db: SQLiteDatabase) {
		this.db = db;
	}

	/**
	 * Returns tags  list
	 */
	public async getTags(): Promise<ITag[]> {
		const { db } = this.db;

		return (db.prepare(tagsQuery).all() as any[]).map(
			({ id, name, resolvedName, parent }) => ({
				id,
				name,
				resolvedName,
				parent: parent ?? null,
			}),
		);
	}

	public async add(name: string, parent: null | string): Promise<string> {
		const { db } = this.db;

		let lastId: number;

		const segments = name.split('/');
		if (segments.length > 1) {
			const results = db.transaction(() =>
				segments.map((name, idx) => {
					const isFirstItem = idx === 0;

					if (isFirstItem) {
						return db
							.prepare(
								'INSERT INTO tags ("id", "name", "parent") VALUES (?, ?, ?)',
							)
							.run(uuid4(), name, parent);
					}

					return db
						.prepare(
							'INSERT INTO tags ("id", "name", "parent") VALUES (?, ?, (SELECT id FROM tags WHERE ROWID=last_insert_rowid()))',
						)
						.run(uuid4(), name);
				}),
			)();

			lastId = Number(results[results.length - 1].lastInsertRowid);
		} else {
			const insertResult = db
				.prepare('INSERT INTO tags ("id", "name", "parent") VALUES (?, ?, ?)')
				.run(uuid4(), name, parent);
			if (insertResult.lastInsertRowid === undefined) {
				throw new Error('Last insert id not found');
			}

			lastId = Number(insertResult.lastInsertRowid);
		}

		// Get generated id
		const selectWithId = (await db
			.prepare('SELECT `id` FROM tags WHERE rowid=?')
			.get(lastId)) as any;
		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		return selectWithId.id;
	}

	public async update(tag: ITagData): Promise<void> {
		const { db } = this.db;

		db.prepare('UPDATE tags SET name=?, parent=? WHERE id=?').run(
			tag.name,
			tag.parent,
			tag.id,
		);
	}

	public async delete(id: string): Promise<void> {
		const { db } = this.db;

		const tagsIdForRemove = (
			db
				.prepare(
					`
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
			SELECT id FROM tagTree WHERE root IN (?) GROUP BY id
		`,
				)
				.all(id) as { id: string }[]
		).map(({ id }) => id);

		db.transaction(() => {
			db.prepare(
				`DELETE FROM tags WHERE id IN (${Array(tagsIdForRemove.length)
					.fill('?')
					.join(',')})`,
			).run(tagsIdForRemove);

			db.prepare(
				`DELETE FROM attachedTags WHERE source IN (${Array(tagsIdForRemove.length)
					.fill('?')
					.join(',')})`,
			).run(tagsIdForRemove);
		})();
	}

	/**
	 * Returns tags attached to a entity
	 */
	public async getAttachedTags(target: string): Promise<ITag[]> {
		const { db } = this.db;

		const query = [
			tagsQuery,
			`WHERE t.id IN (SELECT source FROM attachedTags WHERE target = ?)`,
		].join(' ');

		return (db.prepare(query).all(target) as any[]).map(
			({ id, name, resolvedName, parent }) => ({
				id,
				name,
				resolvedName,
				parent: parent ?? null,
			}),
		);
	}

	public async setAttachedTags(target: string, tags: string[]): Promise<void> {
		const { db } = this.db;

		db.transaction(() => {
			db.prepare(`DELETE FROM attachedTags WHERE target=?`).run(target);
			if (tags.length > 0) {
				db.prepare(
					`INSERT INTO attachedTags(id,source,target) VALUES ${Array(
						tags.length,
					)
						.fill('(?, ?, ?)')
						.join(',')}`,
				).run(tags.map((tagId) => [uuid4(), tagId, target]).flat());
			}
		})();
	}
}
