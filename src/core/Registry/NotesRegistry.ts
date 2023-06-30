import { INotesRegistry, NotesRegistryFetchOptions } from '.';
import { INote, INoteData, NoteId } from '../Note';
import { SQLiteDb } from '../storage/SQLiteDb';

/**
 * Data mappers between DB and objects
 */
const mappers = {
	rowToNoteObject(row: any) {
		const { id, title, text, creationTime, lastUpdateTime } = row;
		return {
			id,
			createdTimestamp: creationTime,
			updatedTimestamp: lastUpdateTime,
			data: { title, text },
		};
	},
};

/**
 * Synced notes registry
 */
export class NotesRegistry implements INotesRegistry {
	private db;
	constructor(db: SQLiteDb) {
		this.db = db;
	}

	public async getById(id: NoteId): Promise<INote | null> {
		const { db } = this.db;
		const note = await db.get('SELECT * FROM notes WHERE id=?', [id]);

		return note ? mappers.rowToNoteObject(note) : null;
	}

	public async getLength(): Promise<number> {
		const { db } = this.db;
		const response = await db.get('SELECT COUNT(id) as length FROM notes');

		const length = response?.length;
		return length;
	}

	public async get({ limit = 100, page = 1 }: NotesRegistryFetchOptions = {}): Promise<INote[]> {
		if (page < 1) throw new TypeError('Page value must not be less than 1');

		const { db } = this.db;

		const notes: INote[] = [];

		const offset = (page - 1) * limit;
		await db.each('SELECT * FROM notes LIMIT ? OFFSET ?;', [limit, offset], (_err, row) => {
			// TODO: handle errors
			// TODO: validate data for first note

			notes.push(mappers.rowToNoteObject(row));
		});

		return notes;
	}

	public async add(note: INoteData): Promise<NoteId> {
		const { db, sync } = this.db;

		const creationTime = new Date().getTime();

		// Insert data
		// Use UUID to generate ID: https://github.com/nalgeon/sqlean/blob/f57fdef59b7ae7260778b00924d13304e23fd32c/docs/uuid.md
		const insertResult = await db.run(
			'INSERT INTO notes ("id","title","text","creationTime","lastUpdateTime") VALUES (uuid4(),:title,:text,:created,:updated)',
			{
				':title': note.title,
				':text': note.text,
				':created': creationTime,
				':updated': creationTime,
			},
		);

		await sync();

		// Get generated id
		const selectWithId = await db.get(
			'SELECT `id` FROM notes WHERE rowid=?',
			insertResult.lastID,
		);
		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		return selectWithId.id;
	}

	public async update(id: string, updatedNote: INoteData) {
		const { db, sync } = this.db;

		const updateTime = new Date().getTime();
		const result = await db.run(
			'UPDATE notes SET "title"=:title, "text"=:text, "lastUpdateTime"=:updateTime WHERE "id"=:id',
			{
				':title': updatedNote.title,
				':text': updatedNote.text,
				':updateTime': updateTime,
				':id': id,
			},
		);

		if (!result.changes || result.changes < 1) {
			throw new Error('Note did not updated');
		}

		await sync();
	}

	public async delete(ids: NoteId[]): Promise<void> {
		const { db, sync } = this.db;

		const placeholders = Array(ids.length).fill('?').join(',');
		const result = await db.run(`DELETE FROM notes WHERE id IN (${placeholders})`, ids);
		await sync();

		if (result.changes !== ids.length) {
			console.warn(`Not match deleted entries length. Expected: ${ids.length}; Deleted: ${result.changes}`)
		}
	}
}
