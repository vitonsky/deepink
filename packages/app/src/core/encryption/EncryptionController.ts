import { extendedBase64 } from './utils/encoding';
import { IEncryptionController, IEncryptionProcessor } from '.';

/**
 * Module to encrypt/decrypt data with provided cipher
 *
 * Operates with `ArrayBuffer`, the strings will encoded as Base64 (about 30% overhead)
 */
export class EncryptionController implements IEncryptionController {
	/**
	 * The limit of bytes to encode to a Base64,
	 * By limit overflow the buffer will splitted and encoded by slices
	 *
	 * The value is 30 Mb
	 */
	private readonly base64EncryptedChunkSize = 31457280;
	private readonly cipher;
	constructor(cipher: IEncryptionProcessor) {
		this.cipher = cipher;
	}

	public encrypt = async <T extends string | ArrayBuffer>(rawData: T): Promise<T> => {
		if (typeof rawData === 'string') {
			// Text encoder may corrupt a binary data, so we use Base64 to encode bytes
			// Source: https://stackoverflow.com/questions/72528453/why-textencoder-encode-produces-different-result-from-file-arraybuffer#comment128121330_72528453
			const encoder = new TextEncoder();
			return this.cipher
				.encrypt(encoder.encode(rawData).buffer)
				.then((encryptedDataBuffer) =>
					extendedBase64.encode(
						encryptedDataBuffer,
						this.base64EncryptedChunkSize,
					),
				) as Promise<T>;
		}

		return this.cipher.encrypt(rawData) as Promise<T>;
	};

	public decrypt = async <T extends string | ArrayBuffer>(
		encryptedData: T,
	): Promise<T> => {
		if (typeof encryptedData === 'string') {
			// For text decoding we assume a text is Base64 encoded binary data
			const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
			return this.cipher
				.decrypt(extendedBase64.decode(encryptedData))
				.then((buffer) => decoder.decode(buffer)) as Promise<T>;
		}

		return this.cipher.decrypt(encryptedData) as Promise<T>;
	};
}
