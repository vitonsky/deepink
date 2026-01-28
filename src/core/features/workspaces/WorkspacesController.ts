import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

const workspaceType = z.object({
	id: z.string(),
	name: z.string(),
});

export class WorkspacesController {
	private readonly db;
	constructor(db: PGLiteDatabase) {
		this.db = db;
	}

	public async create({ name }: { name: string }) {
		const db = wrapDB(this.db.get());

		const {
			rows: [{ id }],
		} = await db.query(
			qb.sql`INSERT INTO workspaces ("name") VALUES (${name}) RETURNING id`,
			z.object({ id: z.string() }),
		);

		return id;
	}

	public async get(id: string) {
		const db = wrapDB(this.db.get());

		const {
			rows: [info],
		} = await db.query(
			qb.sql`SELECT * FROM workspaces WHERE id=${id} ORDER BY ctid`,
			workspaceType,
		);

		return info ?? null;
	}

	public async update(id: string, options: { name?: string }) {
		const db = wrapDB(this.db.get());

		if (Object.values(options).length === 0) return;

		await db.query(
			qb.line(
				'UPDATE workspaces SET',
				qb.values(options),
				qb.where(qb.values({ id })),
			),
		);
	}

	public async getList() {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(qb.sql`SELECT * FROM workspaces`, workspaceType);

		return rows;
	}

	public async delete(ids: string[]) {
		const db = wrapDB(this.db.get());

		await db.query(
			qb.sql`DELETE FROM workspaces WHERE id IN (${qb.values(ids)})`,
			workspaceType,
		);
	}
}
