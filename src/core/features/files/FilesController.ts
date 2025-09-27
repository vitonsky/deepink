import { v4 as uuid4 } from 'uuid';
import { z } from 'zod';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import { SQLiteDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { AttachmentsController } from '../attachments/AttachmentsController';
import { IFilesStorage } from '.';

// TODO: add runtime validation
// TODO: implement interface and use interface instead of class

/**
 * Files manager for local database
 */
export class FilesController {
	private db;
	private fileController;
	private attachments;
	private readonly workspace;
	constructor(
		db: SQLiteDatabase,
		fileController: IFilesStorage,
		attachments: AttachmentsController,
		workspace: string,
	) {
		this.db = db;
		this.fileController = fileController;
		this.attachments = attachments;
		this.workspace = workspace;
	}

	public async add(file: File) {
		const db = this.db.get();

		// Insert in DB
		const insertResult = db
			.prepare(
				'INSERT INTO files ("id","workspace_id","name","mimetype") VALUES (@id,@workspace,@name,@mimetype)',
			)
			.run({
				id: uuid4(),
				workspace: this.workspace,
				name: file.name,
				mimetype: file.type,
			});

		const selectWithId = db
			.prepare('SELECT `id` FROM files WHERE workspace_id=? AND rowid=?')
			.get(this.workspace, insertResult.lastInsertRowid) as any;

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
		const db = this.db.get();

		// Insert in DB
		const fileEntry = db
			.prepare('SELECT * FROM files WHERE workspace_id=? AND id=?')
			.get(this.workspace, id) as any;

		if (!fileEntry) return null;

		const { name, mimetype } = fileEntry;

		const buffer = await this.fileController.get(id);
		if (!buffer) return null;

		// TODO: decrypt file
		return new File([buffer], name, { type: mimetype });
	}

	public async delete(filesId: string[]) {
		const db = this.db.get();

		// Delete in database
		const placeholders = Array(filesId.length).fill('?').join(',');
		db.prepare(
			`DELETE FROM files WHERE workspace_id=? AND id IN (${placeholders})`,
		).run(this.workspace, ...filesId);

		// Delete files
		await this.fileController.delete(filesId);
	}

	public async query() {
		const db = wrapDB(this.db.get());

		return z
			.object({
				id: z.string(),
				name: z.string(),
				mimetype: z.string(),
			})
			.array()
			.parse(
				db.all(
					qb.sql`SELECT id, name, mimetype FROM files WHERE workspace_id=${this.workspace}`,
				),
			);
	}

	public async clearOrphaned() {
		const db = this.db.get();

		const files = db
			.prepare('SELECT id FROM files WHERE workspace_id=?')
			.all(this.workspace) as Array<{ id: string }>;

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
