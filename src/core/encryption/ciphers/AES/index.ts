import { IntegrityError } from '../../EncryptionIntegrityCheck';
import { joinBuffers } from '../../utils/buffers';
import { getRandomBytes } from '../../utils/random';

import { ICipher } from '../..';

/**
 * AES-GCM cipher
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
 * Algorithm recommendations: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
 */
export class AESGCMCipher implements ICipher {
	private readonly ivSize = 96;

	private readonly key;
	constructor(key: CryptoKey) {
		this.key = key;
	}

	public async encrypt(buffer: ArrayBuffer) {
		const iv = getRandomBytes(this.ivSize);
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
