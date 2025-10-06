import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

import { IFilesStorage } from '.';

// TODO: add tests
// TODO: add runtime validation
// TODO: implement interface and use interface instead of class
/**
 * Files manager for local database
 */
export class FilesController {
	private db;
	private fileController;
	private readonly workspace;
	constructor(db: PGLiteDatabase, fileController: IFilesStorage, workspace: string) {
		this.db = db;
		this.fileController = fileController;
		this.workspace = workspace;
	}

	public async add(file: File) {
		const db = wrapDB(this.db.get());

		// Insert in DB
		const {
			rows: [{ id: fileId }],
		} = await db.query(
			qb.sql`INSERT INTO files (workspace_id,name,mimetype) VALUES (${this.workspace},${file.name},${file.type}) RETURNING id`,
			z.object({ id: z.string() }),
		);

		// TODO: delete entry in DB if can't upload file. Or try to upload first and then add file to DB
		// TODO: encrypt file
		// Write file
		const buffer = await file.arrayBuffer();
		await this.fileController.write(this.getFilePath(fileId), buffer);

		return fileId;
	}

	public async get(id: string) {
		const db = wrapDB(this.db.get());

		// Insert in DB
		const [fileEntry] = await db
			.query(
				qb.sql`SELECT * FROM files WHERE workspace_id=${this.workspace} AND id=${id}`,

				z.object({
					name: z.string(),
					mimetype: z.string(),
				}),
			)
			.then((result) => result.rows);

		if (!fileEntry) return null;

		const { name, mimetype } = fileEntry;

		const buffer = await this.fileController.get(this.getFilePath(id));
		if (!buffer) return null;

		// TODO: decrypt file
		return new File([buffer], name, { type: mimetype });
	}

	// TODO: remove attached files
	public async delete(filesId: string[]) {
		const db = wrapDB(this.db.get());

		if (filesId.length === 0) return;

		// Delete in database
		await db.query(
			qb.sql`DELETE FROM files WHERE workspace_id=${
				this.workspace
			} AND id IN (${qb.values(filesId)})`,
		);

		// Delete files
		await this.fileController.delete(
			filesId.map((filename) => this.getFilePath(filename)),
		);
	}

	public async query() {
		const db = wrapDB(this.db.get());

		return await db
			.query(
				qb.sql`SELECT id, name, mimetype FROM files WHERE workspace_id=${this.workspace}`,
				z.object({
					id: z.string(),
					name: z.string(),
					mimetype: z.string(),
				}),
			)
			.then(({ rows }) => rows);
	}

	private getFilePath(filename: string) {
		return [this.workspace, filename].join('/');
	}
}
