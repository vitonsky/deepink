/* eslint-disable camelcase */
import { v4 as uuid4 } from 'uuid';
import { wrapDB } from '@utils/db/wrapDB';
import { qb } from '@utils/SQLBuilder/utils/builder';

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
		const db = wrapDB(this.db.get());

		const note = db.get(
			qb
				.select('*')
				.from('notes')
				.where(
					qb.values({
						workspace_id: this.workspace,
					}),
				)
				.where(qb.values({ id })),
		);
		return note ? mappers.rowToNoteObject(note) : null;
	}

	public async getLength(): Promise<number> {
		const db = wrapDB(this.db.get());

		const { length } = db.get(
			qb
				.select('COUNT(id) as length')
				.from('notes')
				.where(
					qb.values({
						workspace_id: this.workspace,
					}),
				),
		) as {
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

		const db = wrapDB(this.db.get());

		const notes: INote[] = [];

		db.all(
			qb
				.select('*')
				.from('notes')
				.where(
					qb.values({
						workspace_id: this.workspace,
					}),
				)
				.where(
					tags.length > 0
						? qb.line(
								'id IN',
								qb.group(
									qb
										.select('target')
										.from('attachedTags')
										.where(
											qb.line(
												'source IN',
												qb.values(tags).withParenthesis(),
											),
										),
								),
						  )
						: undefined,
				)
				.limit(limit)
				.offset((page - 1) * limit),
		).map((row) => {
			// TODO: validate data for first note

			notes.push(mappers.rowToNoteObject(row));
		});

		return notes;
	}

	public async add(note: INoteContent): Promise<NoteId> {
		const db = wrapDB(this.db.get());

		const creationTime = new Date().getTime();

		// Insert data
		// Use UUID to generate ID: https://github.com/nalgeon/sqlean/blob/f57fdef59b7ae7260778b00924d13304e23fd32c/docs/uuid.md

		const insertResult = db.run(
			qb.line(
				'INSERT INTO notes ("id","workspace_id","title","text","creationTime","lastUpdateTime") VALUES',
				qb
					.values([
						uuid4(),
						this.workspace,
						note.title,
						note.text,
						creationTime,
						creationTime,
					])
					.withParenthesis(),
			),
		);

		// Get generated id
		const selectWithId = db.get(
			qb
				.select('id')
				.from('notes')
				.where(
					qb.values({
						workspace_id: this.workspace,
					}),
				)
				.where(
					qb.values({
						rowid: Number(insertResult.lastInsertRowid),
					}),
				),
		) as { id: string };

		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		return selectWithId.id;
	}

	public async update(id: string, updatedNote: INoteContent) {
		const db = wrapDB(this.db.get());

		const updateTime = new Date().getTime();
		const result = db.run(
			qb.line(
				'UPDATE notes SET',
				qb.values({
					title: updatedNote.title,
					text: updatedNote.text,
					lastUpdateTime: updateTime,
				}),
				qb
					.where(qb.values({ id }))
					.and(qb.values({ workspace_id: this.workspace })),
			),
		);

		if (!result.changes || result.changes < 1) {
			throw new Error('Note did not updated');
		}
	}

	public async delete(ids: NoteId[]): Promise<void> {
		const db = wrapDB(this.db.get());

		const result = db.run(
			qb.line(
				'DELETE FROM notes',
				qb
					.where(
						qb.values({
							workspace_id: this.workspace,
						}),
					)
					.and(qb.line('id IN', qb.values(ids).withParenthesis())),
			),
		);

		if (result.changes !== ids.length) {
			console.warn(
				`Not match deleted entries length. Expected: ${ids.length}; Deleted: ${result.changes}`,
			);
		}
	}
}
