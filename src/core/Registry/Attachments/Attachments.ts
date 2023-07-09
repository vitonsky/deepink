import { SQLiteDb } from "../../storage/SQLiteDb";

import { FilesRegistry } from "../FilesRegistry/FilesRegistry";

// TODO: implement search orphaned resources
/**
 * Attachments manager, to track attachments usage and to keep consistency
 */
export class Attachments {
	private db;

	// TODO: use or remove
	// @ts-ignore
	private filesRegistry;
	constructor(db: SQLiteDb, filesRegistry: FilesRegistry) {
		this.db = db;
		this.filesRegistry = filesRegistry;
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
};