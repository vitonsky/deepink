import { AttachmentsController } from '../attachments/AttachmentsController';
import { IFilesStorage } from '../files';
import { FilesController } from '../files/FilesController';

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

	public async deleteOrphanedFilesInFs() {
		const filePathsInDB = await this.controllers.files
			.query()
			.then((files) => new Set(files.map((file) => this.getFilePath(file.id))));

		const filesInStorage = await this.files.list();
		const orphanedFilePaths = filesInStorage.filter((filePath) => {
			// Skip files out of workspace directory and workspace directory itself
			if (!filePath.startsWith(this.workspace) || filePath === this.workspace)
				return false;

			return !filePathsInDB.has(filePath);
		});

		await this.files.delete(orphanedFilePaths);
	}

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

	public async fixAttachments() {
		const filesId = await this.controllers.files
			.query()
			.then((files) => new Set(files.map((file) => file.id)));
		const attachments = await this.controllers.attachments.query();

		const lostFilesId: string[] = [];
		attachments.forEach((attachment) => {
			if (!filesId.has(attachment.file)) {
				lostFilesId.push(attachment.file);
			}
		});

		await this.controllers.attachments.delete(lostFilesId);
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

	private getFilePath(filename: string) {
		return [this.workspace, filename].join('/');
	}
}
