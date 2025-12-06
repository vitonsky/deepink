/* eslint-disable camelcase */
import z from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import { NoteId } from '..';

export class BookmarksController {
	constructor(
		private readonly db: PGLiteDatabase,
		private readonly workspace: string,
	) {}

	async add(id: NoteId) {
		const db = wrapDB(this.db.get());
		await db.query(
			qb.sql`INSERT INTO bookmarks (note_id, workspace_id) VALUES (${qb.values([
				id,
				this.workspace,
			])})`,
		);
	}

	async remove(ids: NoteId[]) {
		if (ids.length === 0) return;
		await this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			const { affectedRows = 0 } = await db.query(
				qb.sql`DELETE FROM bookmarks WHERE workspace_id=${
					this.workspace
				} AND note_id IN (${qb.values(ids)})`,
			);

			if (affectedRows !== ids.length) {
				console.warn(
					`Not match deleted entries length. Expected: ${ids.length}; Deleted: ${affectedRows}`,
				);
			}
		});
	}

	/**
	 * Check if a note is bookmarked
	 */
	async has(id: NoteId) {
		const db = wrapDB(this.db.get());

		const {
			rows: [noteId],
		} = await db.query(
			qb.sql`SELECT note_id FROM bookmarks WHERE workspace_id=${this.workspace} AND note_id = ${id}`,
			z
				.object({ note_id: z.string() })
				.transform(({ note_id }) => ({ noteId: note_id })),
		);

		return Boolean(noteId);
	}

	/**
	 * Get all bookmarked notes in this workspace
	 */
	async getList() {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.sql`SELECT note_id FROM bookmarks WHERE workspace_id=${this.workspace}`,
			z.object({ note_id: z.string() }),
		);
		return rows;
	}
}
