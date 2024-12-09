import { IEncryptionController } from '@core/encryption';

import { IFileController } from '.';

export class FileControllerWithEncryption implements IFileController {
	private readonly file;
	private readonly encryption;
	constructor(file: IFileController, encryption: IEncryptionController) {
		this.file = file;
		this.encryption = encryption;
	}

	public get = async () => {
		const rawFile = await this.file.get();
		if (!rawFile) return null;

		return this.encryption.decrypt(rawFile);
	};

	public write = async (buffer: ArrayBuffer) => {
		const encryptedBuffer = await this.encryption.encrypt(buffer);
		return this.file.write(encryptedBuffer);
	};

	public delete = async () => {
		return this.file.delete();
	};
}
