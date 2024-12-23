import { createEvent } from 'effector';
import { v4 as uuid4 } from 'uuid';

import { SQLiteDatabase } from '../../../storage/database/SQLiteDatabase/SQLiteDatabase';

import tagsQuery from './selectTagsWithResolvedNames.sql';
import { IResolvedTag, ITag } from '..';

type ChangeEvent = 'tags' | 'noteTags';

export class TagsController {
	private db;
	private readonly onChanged;
	constructor(db: SQLiteDatabase) {
		this.db = db;
		this.onChanged = createEvent<ChangeEvent>();
	}

	public onChange(event: (scope: ChangeEvent) => void) {
		const subscription = this.onChanged.watch(event);
		return () => subscription.unsubscribe();
	}

	/**
	 * Returns tags  list
	 */
	public async getTags(): Promise<IResolvedTag[]> {
		const db = this.db.get();

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
		const db = this.db.get();

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

		this.onChanged('tags');

		return selectWithId.id;
	}

	public async update(tag: ITag): Promise<void> {
		const db = this.db.get();

		db.prepare('UPDATE tags SET name=?, parent=? WHERE id=?').run(
			tag.name,
			tag.parent,
			tag.id,
		);

		this.onChanged('tags');
	}

	public async delete(id: string): Promise<void> {
		const db = this.db.get();

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

		this.onChanged('tags');
	}

	/**
	 * Returns tags attached to a entity
	 */
	public async getAttachedTags(target: string): Promise<IResolvedTag[]> {
		const db = this.db.get();

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
		const db = this.db.get();

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

		this.onChanged('noteTags');
	}
}
