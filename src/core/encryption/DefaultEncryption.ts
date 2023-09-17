import { base64ToBytes, bytesToBase64 } from './encoding';
import { EncryptionModule, ICipher } from '.';

export class DefaultEncryption implements EncryptionModule {
	private readonly cipher;
	constructor(cipher: ICipher) {
		this.cipher = cipher;
	}

	public encrypt = async <T extends string | ArrayBuffer>(rawData: T): Promise<T> => {
		if (typeof rawData === 'string') {
			// Text encoder may corrupt a binary data, so we use Base64 to encode bytes
			// Source: https://stackoverflow.com/questions/72528453/why-textencoder-encode-produces-different-result-from-file-arraybuffer#comment128121330_72528453
			const encoder = new TextEncoder();
			return this.cipher
				.encrypt(encoder.encode(rawData))
				.then((encryptedDataBuffer) =>
					bytesToBase64(encryptedDataBuffer),
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
				.decrypt(base64ToBytes(encryptedData))
				.then((buffer) => decoder.decode(buffer)) as Promise<T>;
		}

		return this.cipher.decrypt(encryptedData) as Promise<T>;
	};
}
