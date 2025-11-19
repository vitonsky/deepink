/* eslint-disable camelcase */
import { createEvent } from 'effector';
import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import tagsQuery from './selectTagsWithResolvedNames.sql';
import { IResolvedTag, ITag } from '..';

type ChangeEvent = 'tags' | 'noteTags';

export enum TAG_ERROR_CODE {
	DUPLICATE = 'Duplicate',
	INVALID_FORMAT = 'InvalidFormat',
}

export class TagControllerError extends Error {
	constructor(message: string, public readonly code: TAG_ERROR_CODE) {
		super(message);
		this.name = this.constructor.name;
	}
}

export const validateTagName = (name: string) => {
	if (name.length === 0) {
		throw new TagControllerError(
			'Tag name must not be empty',
			TAG_ERROR_CODE.INVALID_FORMAT,
		);
	}
	if (name.startsWith('/') || name.endsWith('/')) {
		throw new TagControllerError(
			'Tag name must not start or end with a slash "/"',
			TAG_ERROR_CODE.INVALID_FORMAT,
		);
	}
	if (name.includes('//')) {
		throw new TagControllerError(
			'Tag name must not contain consecutive slashes "//"',
			TAG_ERROR_CODE.INVALID_FORMAT,
		);
	}
};

const RowScheme = z
	.object({
		id: z.string(),
		name: z.string(),
		resolved_name: z.string(),
		parent: z.string().nullable(),
	})
	.transform(({ resolved_name, ...props }) => ({
		...props,
		resolvedName: resolved_name,
	}));

export class TagsController {
	private readonly db;
	private readonly workspace;
	private readonly onChanged;
	constructor(db: PGLiteDatabase, workspace: string) {
		this.db = db;
		this.workspace = workspace;
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
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.line(
				tagsQuery,
				qb.sql`JOIN (SELECT id, ctid FROM tags) s ON t.id = s.id WHERE workspace_id=${this.workspace} ORDER BY s.ctid`,
			),
			RowScheme,
		);

		return rows;
	}

	public async add(name: string, parent: null | string): Promise<string> {
		const db = wrapDB(this.db.get());

		validateTagName(name);

		// check tag unique; tags like (name: 'foo', parent: id), (name: 'foo/bar', parent: id), (name: 'foo/bar', parent: null)
		const filter = parent
			? qb.sql`tags.resolved_name = (SELECT resolved_name || '/' || ${name} FROM tags WHERE id = ${parent})`
			: qb.sql`tags.resolved_name = ${name}`;
		const {
			rows: [duplicatedTag],
		} = await db.query(
			qb.line(
				`WITH tags AS (${tagsQuery}) SELECT count(*) FROM tags`,
				qb.sql`WHERE tags.workspace_id = ${this.workspace} AND (${filter})`,
			),
			z.object({ count: z.number() }),
		);

		if (duplicatedTag.count) {
			throw new TagControllerError(
				`Tag ${name} already exists`,
				TAG_ERROR_CODE.DUPLICATE,
			);
		}

		const segments = name.split('/');
		let lastId: string | null = null;
		if (segments.length > 1) {
			await this.db.get().transaction(async (tx) => {
				const db = wrapDB(tx);

				for (let idx = 0; idx < segments.length; idx++) {
					const name = segments[idx];
					const isFirstItem = idx === 0;

					// reuse existing tags
					const { rows: existing } = await db.query(
						qb.sql`SELECT * FROM tags WHERE name = ${name} 
						AND workspace_id = ${this.workspace} AND parent IS NOT DISTINCT FROM ${
							isFirstItem ? parent : lastId
						}`,
					);
					if (existing.length > 0) {
						lastId = existing[0].id;
						continue;
					}

					if (isFirstItem && !lastId) {
						await db
							.query(
								qb.sql`INSERT INTO tags ("workspace_id", "name", "parent") VALUES (${qb.values(
									[this.workspace, name, parent],
								)}) RETURNING id`,
								z.object({ id: z.string() }),
							)
							.then(({ rows: [{ id }] }) => {
								lastId = id;
							});

						continue;
					}

					console.log('create first', name);

					await db
						.query(
							qb.sql`INSERT INTO tags ("workspace_id", "name", "parent") VALUES (${qb.values(
								[this.workspace, name],
							)}, (SELECT id FROM tags WHERE id=${lastId})) RETURNING id`,
							z.object({ id: z.string() }),
						)
						.then(({ rows: [{ id }] }) => {
							lastId = id;
						});
				}
			});
		} else {
			await db
				.query(
					qb.sql`INSERT INTO tags ("workspace_id", "name", "parent") VALUES (${qb.values(
						[this.workspace, name, parent],
					)}) RETURNING id`,
					z.object({ id: z.string() }),
				)
				.then(({ rows: [{ id }] }) => {
					lastId = id;
				});
		}

		if (!lastId) {
			throw new Error("Can't get id of inserted row");
		}

		this.onChanged('tags');

		return lastId;
	}

	public async update({ name, parent, id }: ITag): Promise<void> {
		const db = wrapDB(this.db.get());

		await db.query(
			qb.sql`UPDATE tags SET name=${name}, parent=${parent} WHERE id=${id} AND workspace_id=${this.workspace}`,
		);

		this.onChanged('tags');
	}

	public async delete(id: string): Promise<void> {
		const db = wrapDB(this.db.get());

		const { rows: tagsIdForRemove } = await db.query(
			qb.sql`WITH RECURSIVE tagTree AS (
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
			SELECT id FROM tagTree WHERE root IN (${id}) GROUP BY id`,
			z.object({ id: z.string() }).transform((row) => row.id),
		);

		await this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			await db.query(
				qb.sql`DELETE FROM tags WHERE workspace_id=${
					this.workspace
				} AND id IN (${qb.values(tagsIdForRemove)})`,
			);
			await db.query(
				qb.sql`DELETE FROM attached_tags WHERE workspace_id=${
					this.workspace
				} AND source IN (${qb.values(tagsIdForRemove)})`,
			);
		});

		this.onChanged('tags');
	}

	/**
	 * Returns tags attached to a entity
	 */
	public async getAttachedTags(target: string): Promise<IResolvedTag[]> {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.line(
				tagsQuery,
				qb.sql`WHERE t.id IN (SELECT source FROM attached_tags WHERE workspace_id=${this.workspace} AND target=${target})`,
			),
			RowScheme,
		);

		return rows;
	}

	public async setAttachedTags(target: string, tags: string[]): Promise<void> {
		await this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			await db.query(
				qb.sql`DELETE FROM attached_tags WHERE workspace_id=${this.workspace} AND target=${target}`,
			);

			if (tags.length > 0) {
				await db.query(
					qb.sql`INSERT INTO attached_tags(workspace_id,source,target) VALUES ${qb.set(
						tags.map((tagId) =>
							qb.values([this.workspace, tagId, target]).withParenthesis(),
						),
					)}`,
				);
			}
		});

		this.onChanged('noteTags');
	}
}
