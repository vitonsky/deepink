import { joinPathSegments } from '@utils/fs/paths';

import { AttachmentsController } from '../attachments/AttachmentsController';
import { IFilesStorage } from '../files';
import { FilesController } from '../files/FilesController';

// TODO: attach files to a note versions, and never delete attached files that is used at least in one version
export class FilesIntegrityController {
	constructor(
		private readonly workspace: string,
		private readonly files: IFilesStorage,
		private readonly controllers: {
			attachments: AttachmentsController;
			files: FilesController;
		},
	) {}

	public async fixAll() {
		await this.deleteOrphanedFilesInFs();
		await this.fixFiles();
		await this.fixAttachments();
		await this.deleteUnattachedFiles();
	}

	/**
	 * Delete files that is in vault directory, but not listed in database
	 */
	public async deleteOrphanedFilesInFs() {
		const filePathsInDB = await this.controllers.files
			.query()
			.then((files) => new Set(files.map((file) => this.getFilePath(file.id))));

		const filesInStorage = await this.files.list();
		const orphanedFilePaths = filesInStorage.filter((filePath) => {
			const workspacePrefix = this.getFilePath();
			// Skip files out of workspace directory and workspace directory itself
			if (!filePath.startsWith(workspacePrefix) || filePath === workspacePrefix)
				return false;

			return !filePathsInDB.has(filePath);
		});

		await this.files.delete(orphanedFilePaths);
	}

	/**
	 * Delete files that is not attached to any note
	 */
	public async deleteUnattachedFiles() {
		const attachedFileIds = await this.controllers.attachments
			.query()
			.then(
				(attachments) =>
					new Set(attachments.map((attachment) => attachment.file)),
			);

		// Collect unattached files
		const unattachedFileIds: string[] = [];
		const files = await this.controllers.files.query();
		files.forEach((file) => {
			if (!attachedFileIds.has(file.id)) {
				unattachedFileIds.push(file.id);
			}
		});

		await this.controllers.files.delete(unattachedFileIds);
	}

	/**
	 * Delete an attachments that refers to a non exists files
	 */
	public async fixAttachments() {
		const fileIds = await this.controllers.files
			.query()
			.then((files) => new Set(files.map((file) => file.id)));

		const attachments = await this.controllers.attachments.query();
		const notFoundFileIds = attachments
			.values()
			.map((attachment) => attachment.file)
			.filter((fileId) => !fileIds.has(fileId))
			.toArray();

		await this.controllers.attachments.delete(notFoundFileIds);
	}

	/**
	 * Deletes files in DB that does not exists in FS
	 */
	public async fixFiles() {
		const filesInStorage = await this.files.list().then((files) => new Set(files));

		// Collect file ids
		const lostFileIds: string[] = [];

		const filesInfo = await this.controllers.files.query();
		filesInfo.forEach((file) => {
			if (!filesInStorage.has(this.getFilePath(file.id))) {
				lostFileIds.push(file.id);
			}
		});

		// Delete
		await this.controllers.files.delete(lostFileIds);
	}

	private getFilePath(filename?: string) {
		return joinPathSegments([this.workspace, filename].filter(Boolean) as string[]);
	}
}
