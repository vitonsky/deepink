import { v4 as uuid4 } from 'uuid';

import { SQLiteDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

/**
 * Attachments manager, to track attachments usage and to keep consistency
 */
export class Attachments {
	private db;
	constructor(db: SQLiteDatabase) {
		this.db = db;
	}

	public async set(targetId: string, attachments: string[]) {
		const { db } = this.db;

		if (attachments.length === 0) {
			db.prepare('DELETE FROM attachments WHERE note=?').run(targetId);
		} else {
			const valuesPlaceholders = attachments.map(() => `(?, ?, ?)`).join(', ');

			const placeholdersData: string[] = [];
			attachments.forEach((attachmentId) => {
				placeholdersData.push(uuid4());
				placeholdersData.push(targetId);
				placeholdersData.push(attachmentId);
			});

			db.transaction(() => {
				db.prepare('DELETE FROM attachments WHERE note=?').run(targetId);
				db.prepare(
					`INSERT INTO attachments ("id", "note", "file") VALUES ${valuesPlaceholders};`,
				).run(placeholdersData);
			})();
		}
	}

	public async get(targetId: string): Promise<string[]> {
		const { db } = this.db;

		return db
			.prepare('SELECT file FROM attachments WHERE note=? ORDER BY rowid')
			.all(targetId)
			.map((row) => (row as { file: string }).file);
	}

	public async delete(resources: string[]) {
		const { db } = this.db;

		const placeholders = Array(resources.length).fill('?').join(',');
		db.prepare(`DELETE FROM attachments WHERE file IN (${placeholders})`).run(
			resources,
		);
	}

	/**
	 * Return array with ids of resources that not in use
	 */
	public async findOrphanedResources(resources: string[]) {
		const { db } = this.db;

		const placeholders = Array(resources.length).fill('?').join(',');
		const attached = db
			.prepare(`SELECT file as id FROM attachments WHERE file IN (${placeholders})`)
			.all(resources) as Array<{ id: string }>;

		return resources.filter((id) =>
			attached.every((attachment) => attachment.id !== id),
		);
	}
}
