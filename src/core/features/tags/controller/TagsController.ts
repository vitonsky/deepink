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
	TAG_NOT_EXIST = 'TagNotExist',
}

export class TagControllerError extends Error {
	constructor(message: string, public readonly code: TAG_ERROR_CODE) {
		super(message);
		this.name = 'TagControllerError';
	}
}

export const validateTagName = (name: string) => {
	if (name.split('/').find((t) => t.trim().length === 0)) {
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

const selectResolvedTags = (workspaceId: string) => {
	return qb.sql`WITH resolved_tags AS (${qb.raw(
		tagsQuery,
	)} WHERE workspace_id = ${workspaceId})`;
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
		validateTagName(name);

		let lastId: string | null = null;

		await this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			// check tag unique
			const {
				rows: [duplicatedTag],
			} = await db.query(
				qb.line(
					qb.sql`${selectResolvedTags(this.workspace)}
					SELECT resolved_name FROM resolved_tags WHERE resolved_name = (${
						parent
							? qb.sql`(SELECT resolved_name || '/' || ${name} FROM resolved_tags WHERE id = ${parent})`
							: qb.value(name)
					}) 
					LIMIT 1`,
				),
				z
					.object({ resolved_name: z.string() })
					.transform(({ resolved_name }) => ({
						resolvedName: resolved_name,
					})),
			);
			if (duplicatedTag) {
				throw new TagControllerError(
					`Tag ${duplicatedTag.resolvedName} already exists`,
					TAG_ERROR_CODE.DUPLICATE,
				);
			}

			const segments = name.split('/');
			if (segments.length > 1) {
				// Create an array of names variants from a string: 'foo/bar' - ['foo', 'foo/bar']
				const tagNameVariants = segments.map((segment, index) =>
					index === 0 ? segment : `${segments.slice(0, index + 1).join('/')}`,
				);

				// Find the most qualified root tag to reuse when creating the tag hierarchy.
				// Get the parent resolved name so we can build the complete path for a given segment ('bar/bar', parent: fooID)
				// and determine which segments actually need to be created.
				const {
					rows: [{ rootTag, parentResolvedName } = {}],
				} = await db.query(
					qb.line(
						qb.sql`${selectResolvedTags(this.workspace)}
					SELECT resolved_name, id, (SELECT resolved_name FROM resolved_tags WHERE id IS NOT DISTINCT FROM ${parent}) AS parent_name
					FROM resolved_tags WHERE resolved_name IN (${
						parent
							? qb.sql`SELECT resolved_name || '/' || segment FROM resolved_tags,
     				unnest(ARRAY[${qb.values(tagNameVariants)}]) AS segment WHERE id = ${parent}
    				UNION ALL SELECT resolved_name FROM resolved_tags WHERE id = ${parent}`
							: qb.sql`${qb.values(tagNameVariants)}`
					}) 
					ORDER BY LENGTH(resolved_name) DESC
					LIMIT 1`,
					),
					z
						.object({
							id: z.string(),
							resolved_name: z.string(),
							parent_name: z.string().nullable(),
						})
						.transform(({ resolved_name, id, parent_name }) => ({
							parentResolvedName: parent_name,
							rootTag: { id, resolvedName: resolved_name },
						})),
				);

				// If parent tag name is not found in the database, the tag hierarchy cannot be created
				if (parent && !parentResolvedName)
					throw new TagControllerError(
						`Parent tag: ${parent} not exist`,
						TAG_ERROR_CODE.TAG_NOT_EXIST,
					);

				let parentTagId = parent;
				let segmentsForCreation = segments;
				if (rootTag) {
					const fullSegments = parentResolvedName
						? `${parentResolvedName}/${name}`.split('/')
						: segments;

					segmentsForCreation = fullSegments.slice(
						rootTag.resolvedName.split('/').length,
					);

					parentTagId = rootTag.id;
				}

				for (let idx = 0; idx < segmentsForCreation.length; idx++) {
					const name = segmentsForCreation[idx];
					const isFirstItem = idx === 0;

					if (isFirstItem) {
						await db
							.query(
								qb.sql`INSERT INTO tags ("workspace_id", "name", "parent") VALUES (${qb.values(
									[this.workspace, name, parentTagId],
								)}) RETURNING id`,
								z.object({ id: z.string() }),
							)
							.then(({ rows: [{ id }] }) => {
								lastId = id;
							});

						continue;
					}

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
		});

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
