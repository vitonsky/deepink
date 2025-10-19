import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import { NoteId } from '..';

export class BookmarksController {
	private db;
	constructor(db: PGLiteDatabase) {
		this.db = db;
	}

	async add(id: NoteId) {
		const db = wrapDB(this.db.get());

		await db.query(qb.sql`INSERT INTO bookmarks VALUES (${qb.values([id])})`);
	}

	async remove(id: NoteId) {
		const db = wrapDB(this.db.get());

		const result = await db.query(
			qb.sql`DELETE FROM bookmarks WHERE note_id = (${qb.values([id])})`,
		);

		if (!result.affectedRows || result.affectedRows < 1) {
			throw new Error('Note did not removed');
		}
	}

	async get(id: NoteId) {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.sql`SELECT note_id FROM bookmarks WHERE note_id = ${id}`,
		);

		return rows.length > 0;
	}
}
