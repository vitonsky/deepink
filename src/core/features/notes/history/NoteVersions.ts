/* eslint-disable camelcase */
import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import { rename } from './rename';

const NoteVersionRowScheme = z.object({
	id: z.string(),
	note_id: z.string(),
	created_at: z.date().transform((date) => date.getTime()),
	title: z.string(),
	text: z.string(),
});

const NoteVersionMapScheme = NoteVersionRowScheme.omit({ note_id: true }).transform(
	rename({ created_at: 'createdAt' } as const),
);

export type NoteVersion = z.TypeOf<typeof NoteVersionMapScheme>;

export class NoteVersions {
	private readonly db;
	private readonly workspace;
	constructor(db: PGLiteDatabase, workspace: string) {
		this.db = db;
		this.workspace = workspace;
	}

	/**
	 * Create note snapshot. Snapshot contains a latest note data.
	 *
	 * In case a most recent snapshot is match latest note data, snapshot will not be created.
	 * Use option `force` to control this behaviour.
	 */
	public async snapshot(
		noteId: string,
		options: {
			/**
			 * Force snapshot creation.
			 *
			 * Creates snapshot even if most recent snapshot match latest note data
			 */
			force?: boolean;
		} = {},
	) {
		const db = wrapDB(this.db.get());

		if (options.force) {
			await db.query(
				qb.sql`
					INSERT INTO note_versions (note_id, created_at, title, text)
					SELECT
						id as note_id, 
						${Date.now()} as created_at,
						title,
						text
					FROM notes
					WHERE id = ${noteId} AND workspace_id = ${this.workspace}
				`,
			);

			return;
		}

		await db.query(
			qb.sql`
				INSERT INTO note_versions (note_id, created_at, title, text)
				SELECT
					id as note_id,
					${Date.now()} as created_at,
					n.title,
					n.text
				FROM notes n
				LEFT JOIN (
					SELECT v.title, v.text, v.note_id
					FROM note_versions v
					-- Order by monotonic "ctid" in case of timestamp collisions
					ORDER BY v.created_at DESC, ctid DESC
					LIMIT 1
				) last ON last.note_id = n.id
				WHERE
					n.id = ${noteId} AND workspace_id = ${this.workspace}
					AND (last.note_id IS NULL OR last.title != n.title OR last.text != n.text)
			`,
		);
	}

	public async getList(noteId: string) {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			// Order by monotonic "ctid" in case of timestamp collisions
			qb.sql`SELECT * FROM note_versions WHERE note_id = ${noteId} ORDER BY created_at DESC, ctid DESC`,
			NoteVersionMapScheme,
		);

		return rows;
	}

	public async get(versionId: string) {
		const db = wrapDB(this.db.get());

		const {
			rows: [version],
		} = await db.query(
			qb.sql`SELECT * FROM note_versions WHERE id = ${versionId} LIMIT 1`,
			NoteVersionMapScheme,
		);

		return version ?? null;
	}

	public async delete(versionIds: string[]) {
		const db = wrapDB(this.db.get());
		db.query(
			qb.sql`DELETE FROM note_versions WHERE id IN (${qb.values(versionIds)})`,
		);
	}

	public async purge(noteIds: string[]) {
		const db = wrapDB(this.db.get());
		db.query(
			qb.sql`DELETE FROM note_versions WHERE note_id IN (${qb.values(noteIds)})`,
		);
	}
}
