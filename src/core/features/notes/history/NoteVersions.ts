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

	/**
	 * Create note snapshot. Snapshot contains a latest note data.
	 *
	 * In case a most recent snapshot is match latest note data, snapshot will not be created.
	 * Use option `force` to control this behaviour.
	 */
	public async snapshot(
		noteId: string,
		options: {
			/**
			 * Force snapshot creation.
			 *
			 * Creates snapshot even if most recent snapshot match latest note data
			 */
			force?: boolean;
		} = {},
	) {
		const db = wrapDB(this.db.get());

		if (options.force) {
			db.run(
				qb.sql`
					INSERT INTO note_versions (id, note_id, created_at, title, text)
					SELECT
						${uuid4()} as id,
						id as note_id, 
						${Date.now()} as created_at,
						title,
						text
					FROM notes
					WHERE id = ${noteId} AND workspace_id = ${this.workspace}
				`,
			);

			return;
		}

		db.run(
			qb.sql`
				INSERT INTO note_versions (id, note_id, created_at, title, text)
				SELECT
					${uuid4()} as id,
					id as note_id,
					${Date.now()} as created_at,
					n.title,
					n.text
				FROM notes n
				LEFT JOIN (
					SELECT v.title, v.text, v.note_id
					FROM note_versions v
					-- Order by monotonic "rowid" in case of timestamp collisions
					ORDER BY v.created_at DESC, rowid DESC
					LIMIT 1
				) last ON last.note_id = n.id
				WHERE
					n.id = ${noteId} AND workspace_id = ${this.workspace}
					AND (last.note_id IS NULL OR last.title != n.title OR last.text != n.text)
			`,
		);
	}

	public async getList(noteId: string) {
		const db = wrapDB(this.db.get());

		return NoteVersionMapScheme.array().parse(
			db.all(
				// Order by monotonic "rowid" in case of timestamp collisions
				qb.sql`SELECT * FROM note_versions WHERE note_id = ${noteId} ORDER BY created_at DESC, rowid DESC`,
			),
		);
	}

	public async get(versionId: string) {
		const db = wrapDB(this.db.get());

		return NoteVersionMapScheme.parse(
			db.get(qb.sql`SELECT * FROM note_versions WHERE id = ${versionId} LIMIT 1`),
		);
	}

	public async delete(versionIds: string[]) {
		const db = wrapDB(this.db.get());
		db.run(qb.sql`DELETE FROM note_versions WHERE id IN (${qb.values(versionIds)})`);
	}

	public async purge(noteIds: string[]) {
		const db = wrapDB(this.db.get());
		db.run(
			qb.sql`DELETE FROM note_versions WHERE note_id IN (${qb.values(noteIds)})`,
		);
	}
}
