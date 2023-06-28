import { INotesRegistry } from '.';
import { INote, INoteData } from '../Note';
import { SQLiteDb } from '../storage/SQLiteDb';

let uidCounter = 0;
/**
 * Return number unique for session
 */
const getUniqueIdForSession = () => ++uidCounter;

/**
 * Synced notes registry
 */
export class NotesRegistry implements INotesRegistry {
	private db;
	constructor(db: SQLiteDb) {
		this.db = db;
	}

	public async get(): Promise<INote[]> {
		const { db } = this.db;

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

	public async add(note: INoteData) {
		const { db, sync } = this.db;

		// TODO: use named placeholders
		const addNote = await db.prepare('INSERT INTO "main"."notes"("id","title","text","creationTime","lastUpdateTime") VALUES (?,?,?,?,?);');

		const time = new Date().getTime();
		// TODO: use UUID for primary key
		const id = String(performance.now()) + getUniqueIdForSession();

		await addNote.run(id, note.title, note.text, time, time);
		await sync();

		return id;
	}

	public async update(id: string, updatedNote: INoteData) {
		const { db, sync } = this.db;

		// TODO: use named placeholders
		const updateNote = await db.prepare(`UPDATE "main"."notes" SET "title"=?, "text"=?, "lastUpdateTime"=? WHERE "id"=?`);

		const time = new Date().getTime();
		await updateNote.run(updatedNote.title, updatedNote.text, time, id);
		await sync();
	}
}
