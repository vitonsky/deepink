/* eslint-disable camelcase */
import { Query } from 'nano-queries/core/Query';
import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
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
		created_at: z.number(),
		updated_at: z.number(),
		history_disabled: z.number(),
		visible: z.number(),
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
		}): INote => ({
			id,
			createdTimestamp: created_at,
			updatedTimestamp: updated_at,
			isSnapshotsDisabled: Boolean(history_disabled),
			isVisible: Boolean(visible),
			content: { title, text },
		}),
	);

function formatNoteMeta(meta: Partial<NoteMeta>) {
	return Object.fromEntries(
		Object.entries(meta).map((item): [string, string | number] => {
			const [key, value] = item as unknown as {
				[K in keyof NoteMeta]: [K, NoteMeta[K]];
			}[keyof NoteMeta];

			switch (key) {
				case 'isSnapshotsDisabled':
					return ['history_disabled', Number(value)];
				case 'isVisible':
					return ['visible', Number(value)];
			}
		}),
	);
}

function getFetchQuery(
	{
		select,
		workspace,
	}: {
		select: Query;
		workspace?: string;
	},
	{ limit, page, tags = [], meta, sort }: NotesControllerFetchOptions = {},
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

	return qb.line(
		qb.sql`SELECT ${select} FROM notes`,
		qb
			.where(workspace ? qb.sql`workspace_id=${workspace}` : undefined)
			.and(
				tags.length === 0
					? undefined
					: qb.sql`id IN (SELECT target FROM attached_tags WHERE source IN (${qb.values(
							tags,
					  )}))`,
			)
			.and(...metaEntries.map(([key, value]) => qb.sql`${qb.raw(key)} = ${value}`)),
		sort
			? qb.line(
					qb.sql`ORDER BY`,
					qb.set([
						sort
							? qb.line(
									sortFieldMap[sort.by],
									sort.order === 'desc' ? 'DESC' : 'ASC',
							  )
							: undefined,
					]),
			  )
			: undefined,
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

		const { rows } = await db.query(
			getFetchQuery({ select: qb.sql`*`, workspace: this.workspace }, query),
			RowScheme,
		);

		return rows;
	}

	public async add(note: INoteContent, meta?: Partial<NoteMeta>): Promise<NoteId> {
		const db = wrapDB(this.db.get());

		const creationTime = new Date().getTime();

		// Insert data
		const metaEntries = Object.entries(formatNoteMeta(meta ?? {}));

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
	}

	public async update(id: string, updatedNote: INoteContent) {
		const db = wrapDB(this.db.get());

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
	}

	public async delete(ids: NoteId[]): Promise<void> {
		const db = wrapDB(this.db.get());

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
