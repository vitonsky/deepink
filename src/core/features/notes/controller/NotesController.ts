/* eslint-disable spellcheck/spell-checker */
/* eslint-disable camelcase */
import { Query } from 'nano-queries/core/Query';
import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { DBTypes, qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import { INote, INoteContent, NoteId } from '..';
import {
	INotesController,
	NoteMeta,
	NotesControllerFetchOptions,
	NoteSortField,
} from '.';

const RowScheme = z
	.object({
		id: z.string(),
		title: z.string(),
		text: z.string(),
		created_at: z.date(),
		updated_at: z.date(),
		history_disabled: z.boolean(),
		visible: z.boolean(),
		deleted: z.boolean(),
		archived: z.boolean(),
	})
	.transform(
		({
			id,
			title,
			text,
			created_at,
			updated_at,
			history_disabled,
			visible,
			deleted,
			archived,
		}): INote => ({
			id,
			createdTimestamp: created_at.getTime(),
			updatedTimestamp: updated_at.getTime(),
			isSnapshotsDisabled: history_disabled,
			isVisible: visible,
			isDeleted: deleted,
			isArchived: archived,
			content: { title, text },
		}),
	);

function formatNoteMeta(meta: Partial<NoteMeta>) {
	return Object.fromEntries(
		Object.entries(meta).map((item): [string, DBTypes] => {
			const [key, value] = item as unknown as {
				[K in keyof NoteMeta]: [K, NoteMeta[K]];
			}[keyof NoteMeta];

			switch (key) {
				case 'isSnapshotsDisabled':
					return ['history_disabled', Boolean(value)];
				case 'isVisible':
					return ['visible', Boolean(value)];
				case 'isDeleted':
					return ['deleted', Boolean(value)];
				case 'isArchived':
					return ['archived', Boolean(value)];
			}
		}),
	);
}

function getFetchQuery(
	{
		select,
		workspace,
	}: {
		select: Query<DBTypes>;
		workspace?: string;
	},
	{
		limit,
		page,
		tags = [],
		meta,
		search,
		sort,
		bookmarks,
	}: NotesControllerFetchOptions = {},
) {
	if (page !== undefined && page < 1)
		throw new TypeError('Page value must not be less than 1');

	const metaEntries = Object.entries(
		formatNoteMeta({
			isVisible: true,
			...meta,
		}),
	);

	const sortFieldMap: { [K in NoteSortField]: string } = {
		id: 'id',
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	};

	const withQuery: { name: string; query: Query<DBTypes> }[] = [];
	const selectAddonsQuery: Query<DBTypes>[] = [];
	const joinQuery: Query<DBTypes>[] = [];
	const filterQuery: Query<DBTypes>[] = [];
	const orderQuery: Query<DBTypes>[] = [];

	// Search
	if (search) {
		// In case a user input contains typos, tsquery will not match,
		// so we extends a query and adds a few alternative lexemes to each
		// Alternative lexemes is extracted from real texts in DB
		// We find the top N of most similar lexemes via trgm
		withQuery.push({
			name: 'user_tokens',
			query: qb.sql`SELECT regexp_split_to_table(lower(unaccent(${search.text})), '\s+') AS token`,
		});
		withQuery.push({
			name: 'token_alternatives',
			query: qb.sql`SELECT t.token,
					l.word AS candidate
				FROM user_tokens t
				LEFT JOIN lexemes l
				ON l.word % t.token
				LIMIT 5`,
		});
		withQuery.push({
			name: 'grouped_alternatives',
			query: qb.sql`SELECT
				plainto_tsquery('simple', string_agg(token, ' ')) AS token,
				to_tsquery('simple', string_agg(candidate, ' | ')) AS or_group
				FROM token_alternatives
				GROUP BY token`,
		});
		withQuery.push({
			name: 'expanded_tsquery',
			query: qb.sql` SELECT
				tsquery_and_agg(token) AS original_query,
				tsquery_and_agg(or_group) AS query
				FROM grouped_alternatives ga`,
		});

		// Filter by expanded query to get more results
		joinQuery.push(qb.sql`CROSS JOIN expanded_tsquery et`);
		filterQuery.push(qb.sql`text_tsv @@ et.query`);

		// Order by original query match first
		orderQuery.push(qb.sql`ts_rank_cd(text_tsv, et.original_query) DESC`);

		// Order not matched results by extended query
		orderQuery.push(qb.sql`ts_rank_cd(text_tsv, et.query) DESC`);
	}

	// Filtering
	if (tags.length > 0) {
		filterQuery.push(
			qb.sql`id IN (SELECT target FROM attached_tags WHERE source IN (${qb.values(
				tags,
			)}))`,
		);
	}

	// Filter by bookmarks
	if (typeof bookmarks === 'boolean') {
		bookmarks
			? filterQuery.push(qb.sql`id IN (SELECT note_id FROM bookmarks)`)
			: filterQuery.push(qb.sql`id NOT IN (SELECT note_id FROM bookmarks)`);
	}

	if (metaEntries.length > 0) {
		filterQuery.push(
			...metaEntries.map(([key, value]) => qb.sql`${qb.raw(key)} = ${value}`),
		);
	}

	// Sort
	if (sort) {
		orderQuery.push(
			qb.line(sortFieldMap[sort.by], sort.order === 'desc' ? 'DESC' : 'ASC'),
		);
	}

	return qb.line(
		withQuery.length > 0
			? qb.line(
					'WITH',
					qb.set(
						withQuery.map(
							({ name, query }) => qb.sql`${qb.raw(name)} AS (${query})`,
						),
					),
			  )
			: undefined,
		qb.sql`SELECT ${qb.set([select, ...selectAddonsQuery])} FROM notes`,
		(joinQuery.length > 0 || undefined) && qb.line(...joinQuery),
		qb
			.where(workspace ? qb.sql`workspace_id=${workspace}` : undefined)
			.and(
				qb.line(
					...filterQuery.map((query, index) =>
						index === 0 ? query : qb.sql`AND ${query}`,
					),
				),
			),
		orderQuery.length > 0 ? qb.sql`ORDER BY ${qb.set(orderQuery)}` : undefined,
		limit ? qb.limit(limit) : undefined,
		page && limit ? qb.offset((page - 1) * limit) : undefined,
	);
}

/**
 * Synced notes registry
 */
export class NotesController implements INotesController {
	private db;
	private readonly workspace;
	constructor(db: PGLiteDatabase, workspace: string) {
		this.db = db;
		this.workspace = workspace;
	}

	public async getById(id: NoteId): Promise<INote | null> {
		const db = wrapDB(this.db.get());

		const {
			rows: [note],
		} = await db.query(
			qb.sql`SELECT * FROM notes WHERE workspace_id=${this.workspace} AND id=${id}`,
			RowScheme,
		);

		return note ?? null;
	}

	public async getLength(query: NotesControllerFetchOptions = {}): Promise<number> {
		const db = wrapDB(this.db.get());

		const {
			rows: [{ count }],
		} = await db.query(
			getFetchQuery(
				{ select: qb.sql`COUNT(*) as count`, workspace: this.workspace },
				query,
			),
			z.object({ count: z.number() }),
		);

		return count;
	}

	public async get(query: NotesControllerFetchOptions = {}): Promise<INote[]> {
		const db = wrapDB(this.db.get());

		console.log('meta', query.meta);

		const { rows } = await db.query(
			getFetchQuery({ select: qb.sql`*`, workspace: this.workspace }, query),
			RowScheme,
		);

		return rows;
	}

	public async add(note: INoteContent, meta?: Partial<NoteMeta>): Promise<NoteId> {
		const creationTime = new Date().getTime();

		// Insert data
		const metaEntries = Object.entries(formatNoteMeta(meta ?? {}));

		return this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			const {
				rows: [id],
			} = await db.query(
				qb.sql`INSERT INTO notes (${qb.set([
					qb.sql`"workspace_id","title","text","created_at","updated_at"`,
					...(metaEntries ? metaEntries.map(([key]) => key) : []),
				])}) VALUES (${qb.values([
					this.workspace,
					note.title,
					note.text,
					creationTime,
					creationTime,
					...metaEntries.map(([_key, value]) => value),
				])}) RETURNING id`,
				z.object({ id: z.string() }).transform(({ id }) => id),
			);

			return id;
		});
	}

	public async update(id: string, updatedNote: INoteContent) {
		await this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			const updateTime = new Date().getTime();
			const result = await db.query(
				qb.line(
					'UPDATE notes SET',
					qb.values({
						title: updatedNote.title,
						text: updatedNote.text,
						// TODO: should we really update note by update meta?
						updated_at: updateTime,
					}),
					qb.sql`WHERE id=${id} AND workspace_id=${this.workspace}`,
				),
			);

			if (!result.affectedRows || result.affectedRows < 1) {
				throw new Error('Note did not updated');
			}
		});
	}

	public async delete(ids: NoteId[]): Promise<void> {
		if (!ids.length) return;
		await this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			const { affectedRows = 0 } = await db.query(
				qb.sql`DELETE FROM notes WHERE workspace_id=${
					this.workspace
				} AND id IN (${qb.values(ids)})`,
			);

			if (affectedRows !== ids.length) {
				console.warn(
					`Not match deleted entries length. Expected: ${ids.length}; Deleted: ${affectedRows}`,
				);
			}
		});
	}

	public async updateMeta(ids: NoteId[], meta: Partial<NoteMeta>): Promise<void> {
		const db = wrapDB(this.db.get());

		const { affectedRows = 0 } = await db.query(
			qb.sql`UPDATE notes SET ${qb.values(formatNoteMeta(meta))}
				WHERE workspace_id=${this.workspace} AND id IN (${qb.values(ids)})`,
		);

		if (affectedRows !== ids.length) {
			console.warn(
				`Not match updated entries length. Expected: ${ids.length}; Updated: ${affectedRows}`,
			);
		}
	}
}
