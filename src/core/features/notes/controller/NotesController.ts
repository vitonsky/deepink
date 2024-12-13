/* eslint-disable camelcase */
import { v4 as uuid4 } from 'uuid';
import { PreparedValue } from '@utils/SQLBuilder/core/PreparedValue';
import { GroupExpression } from '@utils/SQLBuilder/GroupExpression';
import { LimitClause } from '@utils/SQLBuilder/LimitClause';
import { SetExpression } from '@utils/SQLBuilder/SetExpression';
import { QueryConstructor } from '@utils/SQLBuilder/utils/QueryConstructor';
import { WhereClause } from '@utils/SQLBuilder/WhereClause';

import { SQLiteDatabase } from '../../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { INote, INoteContent, NoteId } from '..';
import { INotesController, NotesControllerFetchOptions } from '.';

/**
 * Data mappers between DB and objects
 */
const mappers = {
	rowToNoteObject(row: any): INote {
		const { id, title, text, creationTime, lastUpdateTime } = row;
		return {
			id,
			createdTimestamp: creationTime,
			updatedTimestamp: lastUpdateTime,
			content: { title, text },
		};
	},
};

/**
 * Synced notes registry
 */
export class NotesController implements INotesController {
	private db;
	private readonly workspace;
	constructor(db: SQLiteDatabase, workspace: string) {
		this.db = db;
		this.workspace = workspace;
	}

	public async getById(id: NoteId): Promise<INote | null> {
		const db = this.db.get();
		const note = db
			.prepare('SELECT * FROM notes WHERE workspace_id=? AND id=?')
			.get(this.workspace, id);
		return note ? mappers.rowToNoteObject(note) : null;
	}

	public async getLength(): Promise<number> {
		const db = this.db.get();
		const { length } = db
			.prepare('SELECT COUNT(id) as length FROM notes WHERE workspace_id=?')
			.get(this.workspace) as {
			length?: number;
		};
		return length ?? 0;
	}

	public async get({
		limit = 100,
		page = 1,
		tags = [],
	}: NotesControllerFetchOptions = {}): Promise<INote[]> {
		if (page < 1) throw new TypeError('Page value must not be less than 1');

		const db = this.db.get();

		const notes: INote[] = [];

		const where = new WhereClause();
		const query = new QueryConstructor({ join: ' ' })
			.raw('SELECT * FROM notes')
			.raw(where)
			.raw(new LimitClause({ limit, offset: (page - 1) * limit }));

		where.and('workspace_id=', new PreparedValue(this.workspace));
		if (tags.length > 0) {
			where.and(
				'id IN',
				new GroupExpression(
					'SELECT target FROM attachedTags ',
					new WhereClause().and('source IN ', new SetExpression(...tags)),
				),
			);
		}

		const { sql, bindings } = query.toSQL();

		db.prepare(sql)
			.all(bindings)
			.map((row) => {
				// TODO: validate data for first note

				notes.push(mappers.rowToNoteObject(row));
			});

		return notes;
	}

	public async add(note: INoteContent): Promise<NoteId> {
		const db = this.db.get();

		const creationTime = new Date().getTime();

		// Insert data
		// Use UUID to generate ID: https://github.com/nalgeon/sqlean/blob/f57fdef59b7ae7260778b00924d13304e23fd32c/docs/uuid.md
		const insertResult = db
			.prepare(
				'INSERT INTO notes ("id","workspace_id","title","text","creationTime","lastUpdateTime") VALUES (@id,@workspace,@title,@text,@created,@updated)',
			)
			.run({
				id: uuid4(),
				workspace: this.workspace,
				title: note.title,
				text: note.text,
				created: creationTime,
				updated: creationTime,
			});

		// Get generated id
		const selectWithId = (await db
			.prepare('SELECT `id` FROM notes WHERE workspace_id=? AND rowid=?')
			.get(this.workspace, insertResult.lastInsertRowid)) as { id: string };

		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		return selectWithId.id;
	}

	public async update(id: string, updatedNote: INoteContent) {
		const db = this.db.get();

		const updateTime = new Date().getTime();
		const result = db
			.prepare(
				'UPDATE notes SET "title"=@title, "text"=@text, "lastUpdateTime"=@updateTime WHERE "workspace_id"=@workspace AND "id"=@id',
			)
			.run({
				title: updatedNote.title,
				text: updatedNote.text,
				updateTime: updateTime,
				id: id,
				workspace: this.workspace,
			});

		if (!result.changes || result.changes < 1) {
			throw new Error('Note did not updated');
		}
	}

	public async delete(ids: NoteId[]): Promise<void> {
		const db = this.db.get();

		const placeholders = Array(ids.length).fill('?').join(',');
		const result = db
			.prepare(`DELETE FROM notes WHERE workspace_id=? AND id IN (${placeholders})`)
			.run(this.workspace, ...ids);

		if (result.changes !== ids.length) {
			console.warn(
				`Not match deleted entries length. Expected: ${ids.length}; Deleted: ${result.changes}`,
			);
		}
	}
}
