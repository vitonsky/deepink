import { SQLiteDb } from "../../storage/SQLiteDb";

// TODO: implement search orphaned resources
/**
 * Attachments manager, to track attachments usage and to keep consistency
 */
export class Attachments {
	private db;
	constructor(db: SQLiteDb) {
		this.db = db;
	}

	public async set(targetId: string, attachments: string[]) {
		const { db, sync } = this.db;

		if (attachments.length === 0) {
			await db.getDatabaseInstance().runBatch([
				{ sql: 'DELETE FROM attachments WHERE note=?', params: [targetId] },
			]);
		} else {
			const valuesPlaceholders = attachments.map(() => `(uuid4(), ?, ?)`).join(', ');

			const placeholdersData: string[] = [];
			attachments.forEach((attachmentId) => {
				placeholdersData.push(targetId);
				placeholdersData.push(attachmentId);
			});

			await db.getDatabaseInstance().runBatch([
				{ sql: 'BEGIN TRANSACTION' },
				{ sql: 'DELETE FROM attachments WHERE note=?', params: [targetId] },
				{ sql: `INSERT INTO attachments ("id", "note", "file") VALUES ${valuesPlaceholders};`, params: placeholdersData },
				{ sql: 'COMMIT' },
			]);
		}

		await sync();
	}

	/**
	 * Return array with ids of resources that not in use
	 */
	public async findOrphanedResources(resources: string[]) {
		const { db } = this.db;

		const placeholders = Array(resources.length).fill('?').join(',');
		const attached = await db.all(`SELECT file as id FROM attachments WHERE file IN (${placeholders})`, resources);

		return resources.filter((id) => attached.every((attachment) => attachment.id !== id));
	}
};