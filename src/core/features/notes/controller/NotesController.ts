/* eslint-disable camelcase */
import { v4 as uuid4 } from 'uuid';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import { SQLiteDatabase } from '../../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { INote, INoteContent, NoteId } from '..';
import { INotesController, NoteMeta, NotesControllerFetchOptions } from '.';

/**
 * Data mappers between DB and objects
 */
const mappers = {
	rowToNoteObject(row: any): INote {
		const {
			id,
			title,
			text,
			creationTime,
			lastUpdateTime,
			isSnapshotsDisabled,
			isVisible,
		} = row;
		return {
			id,
			createdTimestamp: creationTime,
			updatedTimestamp: lastUpdateTime,
			isSnapshotsDisabled: Boolean(isSnapshotsDisabled),
			isVisible: Boolean(isVisible),
			content: { title, text },
		};
	},
};

function formatNoteMeta(meta: Partial<NoteMeta>) {
	return Object.fromEntries(
		Object.entries(meta).map((item): [string, string | number] => {
			const [key, value] = item as unknown as {
				[K in keyof NoteMeta]: [K, NoteMeta[K]];
			}[keyof NoteMeta];

			switch (key) {
				case 'isSnapshotsDisabled':
					return [key, Number(value)];
				case 'isVisible':
					return [key, Number(value)];
			}
		}),
	);
}

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
		meta,
	}: NotesControllerFetchOptions = {}): Promise<INote[]> {
		if (page < 1) throw new TypeError('Page value must not be less than 1');

		const db = wrapDB(this.db.get());

		const notes: INote[] = [];

		const metaEntries = Object.entries(
			formatNoteMeta({
				isVisible: true,
				...meta,
			}),
		);

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
					qb
						.condition(
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
						.and(
							...metaEntries.map(
								([key, value]) => qb.sql`${qb.raw(key)} = ${value}`,
							),
						),
				)
				.limit(limit)
				.offset((page - 1) * limit),
		).map((row) => {
			// TODO: validate data for first note

			notes.push(mappers.rowToNoteObject(row));
		});

		return notes;
	}

	public async add(note: INoteContent, meta?: Partial<NoteMeta>): Promise<NoteId> {
		const db = wrapDB(this.db.get());

		const creationTime = new Date().getTime();

		// Insert data
		// Use UUID to generate ID: https://github.com/nalgeon/sqlean/blob/f57fdef59b7ae7260778b00924d13304e23fd32c/docs/uuid.md

		const metaEntries = Object.entries(formatNoteMeta(meta ?? {}));

		const insertResult = db.run(
			qb.sql`
				INSERT INTO notes (${qb.set([
					qb.sql`"id","workspace_id","title","text","creationTime","lastUpdateTime"`,
					...(metaEntries ? metaEntries.map(([key]) => key) : []),
				])})
					VALUES (${qb.values([
						uuid4(),
						this.workspace,
						note.title,
						note.text,
						creationTime,
						creationTime,
						...metaEntries.map(([_key, value]) => value),
					])})`,
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

	public async updateMeta(ids: NoteId[], meta: Partial<NoteMeta>): Promise<void> {
		const db = wrapDB(this.db.get());

		const result = db.run(
			qb.sql`UPDATE notes
				SET ${qb.values(formatNoteMeta(meta))}
				WHERE workspace_id=${this.workspace} AND id IN (${qb.values(ids)})`,
		);

		if (result.changes !== ids.length) {
			console.warn(
				`Not match updated entries length. Expected: ${ids.length}; Updated: ${result.changes}`,
			);
		}
	}
}
