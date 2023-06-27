import { INote, INoteData } from '../Note';
import { SQLiteDb, getDb } from '../storage/SQLiteDb';

// TODO: add registry interface and implement it
/**
 * Synced notes registry
 */
export class NotesRegistry {
	private db: null | Promise<SQLiteDb> = null;
	private getDb() {
		if (this.db === null) {
			this.db = getDb();
		}

		return this.db;
	}

	public async getNotes(): Promise<INote[]> {
		const { db } = await this.getDb();

		const notes: INote[] = [];
		// TODO: return with no limit
		await db.each('select * from notes LIMIT 1000;', (_err, row) => {
			// TODO: handle errors
			// TODO: validate data for first note

			const { id, title, text, creationTime, lastUpdateTime } = row;
			notes.push({
				id,
				createdTimestamp: creationTime,
				updatedTimestamp: lastUpdateTime,
				data: { title, text },
			});
		});

		return notes;
	}

	public async addNote(note: INoteData) {
		const { db, sync } = await this.getDb();

		// TODO: use named placeholders
		const addNote = await db.prepare('INSERT INTO "main"."notes"("id","title","text","creationTime","lastUpdateTime") VALUES (?,?,?,?,?);');

		const time = new Date().getTime();
		// TODO: use UUID for primary key
		const id = String(time);

		await addNote.run(time, note.title, note.text, time, time);
		await sync();

		return id;
	}

	public async updateNote(id: string, updatedNote: INoteData) {
		const { db, sync } = await this.getDb();

		// TODO: use named placeholders
		const updateNote = await db.prepare(`UPDATE "main"."notes" SET "title"=?, "text"=?, "lastUpdateTime"=? WHERE "id"=?`);

		const time = new Date().getTime();
		await updateNote.run(updatedNote.title, updatedNote.text, time, id);
		await sync();
	}
}
