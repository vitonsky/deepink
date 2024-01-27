import { v4 as uuid4 } from 'uuid';

import { INote, INoteData, NoteId } from '../Note';
import { SQLiteDb } from '../storage/SQLiteDb';
import { INotesRegistry, NotesRegistryFetchOptions } from '.';

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
		const note = db.prepare('SELECT * FROM notes WHERE id=?').get(id);
		return note ? mappers.rowToNoteObject(note) : null;
	}

	public async getLength(): Promise<number> {
		const { db } = this.db;
		const { length } = db.prepare('SELECT COUNT(id) as length FROM notes').get() as {
			length?: number;
		};
		return length ?? 0;
	}

	public async get({
		limit = 100,
		page = 1,
		tags = [],
	}: NotesRegistryFetchOptions = {}): Promise<INote[]> {
		if (page < 1) throw new TypeError('Page value must not be less than 1');

		const { db } = this.db;

		const notes: INote[] = [];

		const fetchQuery = ['SELECT * FROM notes'];
		const fetchParams: (number | string)[] = [];

		if (tags.length > 0) {
			const placeholders = Array(tags.length).fill('?').join(',');

			fetchQuery.push(
				`WHERE id IN (SELECT target FROM attachedTags WHERE source IN (${placeholders}))`,
			);
			fetchParams.push(...tags);
		}

		const offset = (page - 1) * limit;
		fetchQuery.push(`LIMIT ? OFFSET ?`);
		fetchParams.push(limit, offset);

		db.prepare(fetchQuery.join(' '))
			.all(fetchParams)
			.map((row) => {
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
		const insertResult = db
			.prepare(
				'INSERT INTO notes ("id","title","text","creationTime","lastUpdateTime") VALUES (@id,@title,@text,@created,@updated)',
			)
			.run({
				id: uuid4(),
				title: note.title,
				text: note.text,
				created: creationTime,
				updated: creationTime,
			});

		await sync();

		// Get generated id
		const selectWithId = (await db
			.prepare('SELECT `id` FROM notes WHERE rowid=?')
			.get(insertResult.lastInsertRowid)) as { id: string };

		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		return selectWithId.id;
	}

	public async update(id: string, updatedNote: INoteData) {
		const { db, sync } = this.db;

		const updateTime = new Date().getTime();
		const result = db
			.prepare(
				'UPDATE notes SET "title"=@title, "text"=@text, "lastUpdateTime"=@updateTime WHERE "id"=@id',
			)
			.run({
				title: updatedNote.title,
				text: updatedNote.text,
				updateTime: updateTime,
				id: id,
			});

		if (!result.changes || result.changes < 1) {
			throw new Error('Note did not updated');
		}

		await sync();
	}

	public async delete(ids: NoteId[]): Promise<void> {
		const { db, sync } = this.db;

		const placeholders = Array(ids.length).fill('?').join(',');
		const result = db
			.prepare(`DELETE FROM notes WHERE id IN (${placeholders})`)
			.run(ids);

		await sync();

		if (result.changes !== ids.length) {
			console.warn(
				`Not match deleted entries length. Expected: ${ids.length}; Deleted: ${result.changes}`,
			);
		}
	}
}
