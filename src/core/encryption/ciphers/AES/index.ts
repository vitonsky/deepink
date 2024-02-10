import { IntegrityError } from '../../processors/BufferIntegrityProcessor';
import { joinBuffers } from '../../utils/buffers';

import { IEncryptionProcessor } from '../..';

/**
 * AES-GCM cipher
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
 * Algorithm recommendations: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
 */
export class AESGCMCipher implements IEncryptionProcessor {
	private readonly ivSize = 96;

	private readonly key;
	private readonly randomBytesGenerator: (size: number) => ArrayBuffer;
	constructor(key: CryptoKey, randomBytesGenerator: (size: number) => ArrayBuffer) {
		this.key = key;
		this.randomBytesGenerator = randomBytesGenerator;
	}

	public async encrypt(buffer: ArrayBuffer) {
		const iv = this.randomBytesGenerator(this.ivSize);
		const encryptedBuffer = await self.crypto.subtle.encrypt(
			{
				name: 'AES-GCM',

				// Don't re-use initialization vectors!
				// Always generate a new iv every time your encrypt!
				// Recommended to use 96 bytes length
				iv,

				// Tag length (optional)
				// can be 32, 64, 96, 104, 112, 120 or 128 (default)
				tagLength: 128,
			},
			this.key,
			buffer,
		);

		// Include public parameters to a cipher-buffer
		return joinBuffers([iv, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		// Extract data of cipher-buffer
		const iv = buffer.slice(0, this.ivSize);
		const encryptedBuffer = buffer.slice(this.ivSize);

		return self.crypto.subtle
			.decrypt(
				{
					name: 'AES-GCM',
					//The initialization vector been used to encrypt
					iv,

					//The tagLength you used to encrypt (if any)
					tagLength: 128,
				},
				this.key,
				encryptedBuffer,
			)
			.catch((err) => {
				if (
					err instanceof Error &&
					err.name === 'OperationError' &&
					err.message === ''
				) {
					throw new IntegrityError('Decryption error. Integrity checks fails');
				}

				throw err;
			});
	}
}
