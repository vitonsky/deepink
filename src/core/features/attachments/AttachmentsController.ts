import { z } from 'zod';
import { ManagedDatabase } from '@core/storage/database/ManagedDatabase';
import { SQLiteDB } from '@core/storage/database/sqlite';
import { qb } from '@core/storage/database/sqlite/utils/query-builder';
import { wrapSQLite } from '@core/storage/database/sqlite/utils/wrapDB';

/**
 * attachments manager, to track attachments usage and to keep consistency
 */
export class AttachmentsController {
	constructor(
		private readonly db: ManagedDatabase<SQLiteDB>,
		private readonly workspace: string,
	) {}

	public async set(targetId: string, attachments: string[]) {
		const db = wrapSQLite(this.db.get());

		await db.query(
			qb.sql`DELETE FROM attachments WHERE workspace_id=${this.workspace} AND note=${targetId}`,
		);

		if (attachments.length > 0) {
			await db.query(
				qb.sql`INSERT INTO attachments ("workspace_id", "note", "file") VALUES ${qb.set(
					attachments.map((fileId) =>
						qb.values([this.workspace, targetId, fileId]).withParenthesis(),
					),
				)}`,
			);
		}
	}

	public async get(targetId: string): Promise<string[]> {
		const db = wrapSQLite(this.db.get());

		return await db.query(
			qb.sql`
				SELECT file FROM attachments
				WHERE workspace_id=${this.workspace} AND note=${targetId}
				ORDER BY rowid
			`,
			z.object({ file: z.string() }).transform((row) => row.file),
		);
	}

	public async delete(resources: string[]) {
		const db = wrapSQLite(this.db.get());

		if (resources.length === 0) return;

		await db.query(
			qb.sql`DELETE FROM attachments WHERE workspace_id=${
				this.workspace
			} AND file IN (${qb.values(resources)})`,
		);
	}

	public async query() {
		const db = wrapSQLite(this.db.get());

		return await db.query(
			qb.sql`SELECT id, file, note FROM attachments WHERE workspace_id=${this.workspace}`,
			z.object({
				id: z.string(),
				file: z.string(),
				note: z.string(),
			}),
		);
	}
}
