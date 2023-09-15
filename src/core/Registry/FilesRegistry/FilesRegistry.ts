import { SQLiteDb } from '../../storage/SQLiteDb';

import { Attachments } from '../Attachments/Attachments';
import { FilesStorageController } from '.';

// TODO: add runtime validation
// TODO: implement interface and use interface instead of class

/**
 * Files manager for local database
 */
export class FilesRegistry {
	private db;
	private fileController;
	private attachments;
	constructor(
		db: SQLiteDb,
		fileController: FilesStorageController,
		attachments: Attachments,
	) {
		this.db = db;
		this.fileController = fileController;
		this.attachments = attachments;
	}

	public async add(file: File) {
		const { db } = this.db;

		// Insert in DB
		const insertResult = await db.run(
			'INSERT INTO files ("id","name","mimetype") VALUES (uuid4(),:name,:mimetype)',
			{
				':name': file.name,
				':mimetype': file.type,
			},
		);

		const selectWithId = await db.get(
			'SELECT `id` FROM files WHERE rowid=?',
			insertResult.lastID,
		);
		if (!selectWithId || !selectWithId.id) {
			throw new Error("Can't get id of inserted row");
		}

		const fileId: string = selectWithId.id;

		// TODO: delete entry in DB if can't upload file. Or try to upload first and then add file to DB
		// TODO: encrypt file
		// Write file
		const buffer = await file.arrayBuffer();
		this.fileController.write(fileId, buffer);

		return fileId;
	}

	public async get(id: string) {
		const { db } = this.db;

		// Insert in DB
		const fileEntry = await db.get('SELECT * FROM files WHERE id=:id', {
			':id': id,
		});

		if (!fileEntry) return null;

		const { name, mimetype } = fileEntry;

		const buffer = await this.fileController.get(id);
		if (!buffer) return null;

		// TODO: decrypt file
		return new File([buffer], name, { type: mimetype });
	}

	public async delete(filesId: string[]) {
		const { db } = this.db;

		// Delete in database
		const placeholders = Array(filesId.length).fill('?').join(',');
		await db.run(`DELETE FROM files WHERE id IN (${placeholders})`, filesId);

		// Delete files
		await this.fileController.delete(filesId);
	}

	public async clearOrphaned() {
		const { db } = this.db;

		const files = await db.all('SELECT id FROM files');

		// Remove orphaned files in FS
		const filesInStorage = await this.fileController.list();
		const orphanedFilesInFs = filesInStorage.filter((id) => {
			const isFoundInDb = files.some((file) => file.id === id);
			return !isFoundInDb;
		});
		await this.fileController.delete(orphanedFilesInFs);

		// Remove files from DB
		const orphanedFilesInDatabase = await this.attachments.findOrphanedResources(
			files.map(({ id }) => id),
		);
		await this.attachments.delete(orphanedFilesInDatabase);
		await this.delete(orphanedFilesInDatabase);
	}
}
