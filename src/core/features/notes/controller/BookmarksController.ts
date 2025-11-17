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
		const db = wrapDB(this.db.get());

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
	}

	/**
	 * Checks if a note is bookmarked
	 */
	async has(id: NoteId) {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.sql`SELECT note_id FROM bookmarks WHERE workspace_id=${this.workspace} AND note_id = ${id}`,
		);
		return rows.length > 0;
	}
}
