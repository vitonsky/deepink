import { IFileController, IFilesStorage } from '.';

export class FileController implements IFileController {
	private readonly file;
	private readonly filesController;
	constructor(file: string, filesController: IFilesStorage) {
		this.file = file;
		this.filesController = filesController;
	}

	public get = async () => this.filesController.get(this.file);
	public write = async (buffer: ArrayBuffer) =>
		this.filesController.write(this.file, buffer);
	public delete = async () => this.filesController.delete([this.file]);
}
