import { IEncryptionController } from '.';

/**
 * Placeholder of encryption controller
 * With this implementation, data WILL NOT BE ENCRYPTED
 */
export class PlaceholderEncryptionController implements IEncryptionController {
	public encrypt = async <T extends string | ArrayBuffer>(data: T): Promise<T> => {
		return data;
	};

	public decrypt = async <T extends string | ArrayBuffer>(data: T): Promise<T> => {
		return data;
	};
}
