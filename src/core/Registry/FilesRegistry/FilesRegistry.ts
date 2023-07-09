import { SQLiteDb } from "../../storage/SQLiteDb";

import { Attachments } from "../Attachments/Attachments";
import { FilesStorageController } from ".";

// TODO: implement class to track resources references and implement garbage collector for this class
// TODO: add runtime validation
// TODO: write tests
// TODO: implement interface and use interface instead of class

/**
 * Files manager for local database
 */
export class FilesRegistry {
	private db;
	private fileController;
	private attachments;
	constructor(db: SQLiteDb, fileController: FilesStorageController, attachments: Attachments) {
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

		const fileId = selectWithId.id;

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
		const fileEntry = await db.get(
			'SELECT * FROM files WHERE id=:id',
			{
				':id': id,
			},
		);

		if (!fileEntry) return null;

		const { name, mimetype } = fileEntry;

		const buffer = await this.fileController.get(id);
		if (!buffer) return null;

		// TODO: decrypt file
		return new File([buffer], name, { type: mimetype });
	}

	public async clearOrphaned() {
		const { db } = this.db;

		// Find orphaned files in DB
		const files = await db.all('SELECT * FROM files');

		const orphanedIds = await this.attachments.findOrphanedResources(files.map(({ id }) => id));
		const orphanedFilesInDb = files.filter(({ id }) => orphanedIds.includes(id));

		// Find orphaned files in FS
		const filesInStorage = await this.fileController.list();
		const orphanedFilesInFs = filesInStorage.filter((id) => {
			const isFoundInDb = files.some((file) => file.id === id);
			return !isFoundInDb;
		});

		// Remove files from DB
		const orphanedFilesInDbIds = orphanedFilesInDb.map(({ id }) => id);
		const placeholders = Array(orphanedFilesInDbIds.length).fill('?').join(',');
		await db.run(`DELETE FROM files WHERE id IN (${placeholders})`, orphanedFilesInDbIds);

		const filesToRemove = [...orphanedFilesInDbIds, ...orphanedFilesInFs];
		await this.fileController.delete(filesToRemove);
	}
}