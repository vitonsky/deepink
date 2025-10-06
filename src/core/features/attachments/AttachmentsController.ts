import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

/**
 * attachments manager, to track attachments usage and to keep consistency
 */
export class AttachmentsController {
	private db;
	private readonly workspace;
	constructor(db: PGLiteDatabase, workspace: string) {
		this.db = db;
		this.workspace = workspace;
	}

	public async set(targetId: string, attachments: string[]) {
		await this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			await db.query(
				qb.sql`DELETE FROM attachments WHERE workspace_id=${this.workspace} AND note=${targetId}`,
			);

			if (attachments.length > 0) {
				await db.query(
					qb.sql`INSERT INTO attachments ("workspace_id", "note", "file") VALUES ${qb.set(
						attachments.map((fileId) =>
							qb
								.values([this.workspace, targetId, fileId])
								.withParenthesis(),
						),
					)}`,
				);
			}
		});
	}

	public async get(targetId: string): Promise<string[]> {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.sql`
				SELECT file FROM attachments
				WHERE workspace_id=${this.workspace} AND note=${targetId}
				ORDER BY ctid
			`,
			z.object({ file: z.string() }).transform((row) => row.file),
		);

		return rows;
	}

	public async delete(resources: string[]) {
		const db = wrapDB(this.db.get());

		if (resources.length === 0) return;

		await db.query(
			qb.sql`DELETE FROM attachments WHERE workspace_id=${
				this.workspace
			} AND file IN (${qb.values(resources)})`,
		);
	}

	public async query() {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.sql`SELECT id, file, note FROM attachments WHERE workspace_id=${this.workspace}`,
			z.object({
				id: z.string(),
				file: z.string(),
				note: z.string(),
			}),
		);

		return rows;
	}
}
