/* eslint-disable camelcase */
import { v4 as uuid4 } from 'uuid';
import { z } from 'zod';
import { SQLiteDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

/**
 * Return mapper function that receive original object and returns new object with renamed fields according to names map
 *
 * For type safe use it's necessary to use `as const` like that `rename({ created_at: 'createdAt' } as const)`
 */
const rename =
	<M extends Record<string, string>>(map: M) =>
	<T extends Record<string, any>>(
		input: keyof M extends keyof T ? T : never,
	): {
		[K in keyof T as K extends keyof M ? M[K] : K]: T[K];
	} => {
		const result: Record<string, any> = {};
		for (const [key, value] of Object.entries(input)) {
			result[map[key] ?? key] = value;
		}

		return result as any;
	};

const NoteVersionRowScheme = z.object({
	id: z.string(),
	note_id: z.string(),
	created_at: z.number(),
	title: z.string(),
	text: z.string(),
});

const NoteVersionMapScheme = NoteVersionRowScheme.omit({ note_id: true }).transform(
	rename({ created_at: 'createdAt' } as const),
);

export class NoteVersions {
	private db;
	private readonly workspace;
	constructor(db: SQLiteDatabase, workspace: string) {
		this.db = db;
		this.workspace = workspace;
	}

	public async snapshot(noteId: string) {
		const db = wrapDB(this.db.get());

		db.run(
			qb.sql`INSERT INTO note_versions (id, note_id, created_at, title, text) SELECT ${uuid4()} as id, ${noteId} as note_id, ${new Date().getTime()} as created_at, title, text FROM notes WHERE id = ${noteId} AND workspace_id = ${
				this.workspace
			}`,
		);
	}

	public async getList(noteId: string) {
		const db = wrapDB(this.db.get());

		return NoteVersionMapScheme.array().parse(
			db.all(
				qb.sql`SELECT * FROM note_versions WHERE note_id = ${noteId} ORDER BY created_at DESC`,
			),
		);
	}

	public async get(versionId: string) {
		const db = wrapDB(this.db.get());

		return NoteVersionMapScheme.parse(
			db.get(qb.sql`SELECT * FROM note_versions WHERE id = ${versionId} LIMIT 1`),
		);
	}

	public async delete(versionId: string) {
		const db = wrapDB(this.db.get());
		db.run(qb.sql`DELETE FROM note_versions WHERE id = ${versionId}`);
	}

	public async purge(noteId: string) {
		const db = wrapDB(this.db.get());
		db.run(qb.sql`DELETE FROM note_versions WHERE note_id = ${noteId}`);
	}
}
