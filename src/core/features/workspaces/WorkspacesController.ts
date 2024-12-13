import { v4 as uuid4 } from 'uuid';
import { z } from 'zod';

import { SQLiteDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

const workspaceType = z.object({
	id: z.string(),
	name: z.string(),
});

// TODO: add zod validator
export class WorkspacesController {
	private db;
	constructor(db: SQLiteDatabase) {
		this.db = db;
	}

	public async create(options: { name: string }) {
		const db = this.db.get();

		const id = uuid4();
		db.prepare(`INSERT INTO workspaces ("id", "name") VALUES (?, ?);`).run(
			id,
			options.name,
		);

		return id;
	}

	public async get(id: string) {
		const db = this.db.get();

		return workspaceType
			.or(z.null())
			.parse(
				db
					.prepare('SELECT * FROM workspaces WHERE id=? ORDER BY rowid')
					.get(id) ?? null,
			);
	}

	public async getList() {
		const db = this.db.get();

		return workspaceType.array().parse(db.prepare('SELECT * FROM workspaces').all());
	}

	public async delete(ids: string[]) {
		const db = this.db.get();

		const placeholders = Array(ids.length).fill('?').join(',');
		db.prepare(`DELETE FROM workspaces WHERE id IN (${placeholders})`).run(ids);
	}
}
