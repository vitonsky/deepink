/* eslint-disable camelcase */
import { createEvent } from 'effector';
import { Query } from 'nano-queries/core/Query';
import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { DBTypes, qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import tagsQuery from './selectTagsWithResolvedNames.sql';
import { IResolvedTag, ITag } from '..';

type ChangeEvent = 'tags' | 'noteTags';

export enum TAG_ERROR_CODE {
	DUPLICATE = 'Duplicate',
	INVALID_FORMAT = 'InvalidFormat',
	PARENT_TAG_NOT_EXIST = 'ParentTagNotExist',
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

const selectResolvedTags = (
	workspaceId: string,
	queries?: {
		filter?: Query<DBTypes>[];
		order?: Query<DBTypes>;
		limit?: number;
	},
) => {
	return qb.line(
		qb.raw(tagsQuery),
		qb
			.where(qb.sql`workspace_id=${workspaceId}`)
			.and(
				queries?.filter
					? qb.line(
							...queries.filter.map((query, index) =>
								index === 0 ? query : qb.sql`AND ${query}`,
							),
					  )
					: undefined,
			),
		queries?.order ? queries.order : undefined,
		queries?.limit ? qb.limit(queries.limit) : undefined,
	);
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

const resolvedNameSchema = z
	.object({ resolved_name: z.string() })
	.transform(({ resolved_name }) => ({
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

			let resolvedTagName: string;
			if (!parent) {
				resolvedTagName = name;
			} else {
				const {
					rows: [parentTag],
				} = await db.query(
					selectResolvedTags(this.workspace, {
						filter: [qb.sql`t.id = ${parent}`],
						limit: 1,
					}),
					resolvedNameSchema,
				);
				// If the parent tag is not found in the database, the tag cannot be created
				if (!parentTag)
					throw new TagControllerError(
						`Parent tag ${parent} does not exist`,
						TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST,
					);
				resolvedTagName = `${parentTag.resolvedName}/${name}`;
			}

			// Check tag uniqueness
			const {
				rows: [duplicateTag],
			} = await db.query(
				selectResolvedTags(this.workspace, {
					filter: [qb.sql`resolved_name = ${resolvedTagName}`],
					limit: 1,
				}),
				resolvedNameSchema,
			);
			if (duplicateTag) {
				throw new TagControllerError(
					`Tag ${duplicateTag.resolvedName} already exists`,
					TAG_ERROR_CODE.DUPLICATE,
				);
			}

			const resolvedTagSegments = resolvedTagName.split('/');
			if (resolvedTagSegments.length > 1) {
				// Build an array of all path variants to find existing tags that match exactly this one
				// 'foo/bar/baz' - ['foo', 'foo/bar', 'foo/bar/baz']
				// The found tag allows detecting non-existing segments from resolvedTagSegments and creating only those
				const tagNameVariants = resolvedTagSegments.reduce<string[]>(
					(prev, segment) => [
						...prev,
						prev.length ? `${prev[prev.length - 1]}/${segment}` : segment,
					],
					[],
				);
				const {
					rows: [rootTag],
				} = await db.query(
					selectResolvedTags(this.workspace, {
						filter: [
							qb.sql`resolved_name IN (${qb.values(tagNameVariants)})`,
						],
						order: qb.sql`ORDER BY LENGTH(resolved_name) DESC`,
						limit: 1,
					}),
					z
						.object({
							id: z.string(),
							resolved_name: z.string(),
						})
						.transform(({ resolved_name, id }) => ({
							id,
							resolvedName: resolved_name,
						})),
				);

				const parentTagId = rootTag ? rootTag.id : parent;
				const segmentsForCreation = rootTag
					? resolvedTagSegments.slice(rootTag.resolvedName.split('/').length)
					: resolvedTagSegments;

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
