import { IntegrityError } from '../../EncryptionIntegrityCheck';
import { joinBuffers } from '../../utils/buffers';
import { getRandomBytes } from '../../utils/random';

import { ICipher } from '../..';

export async function getDerivedKey(passKey: string, salt: Uint8Array) {
	const codec = new TextEncoder();
	const keyBytes = codec.encode(passKey);

	const derivedKey = await self.crypto.subtle
		.importKey('raw', keyBytes, { name: 'PBKDF2' }, false, [
			'deriveBits',
			'deriveKey',
		])
		.then((key) => {
			return self.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt,
					iterations: 100,
					hash: 'SHA-512',
				},
				key,

				// For AES the length required to be 128 or 256 bits (not bytes)
				{ name: 'AES-CBC', length: 256 },

				// Whether or not the key is extractable (less secure) or not (more secure)
				// when false, the key can only be passed as a web crypto object, not inspected
				true,

				// this web crypto object will only be allowed for these functions
				['encrypt', 'decrypt'],
			);
		})
		.then((webKey) => crypto.subtle.exportKey('raw', webKey));

	return self.crypto.subtle.importKey(
		'raw',
		derivedKey,
		{
			//this is the algorithm options
			name: 'AES-GCM',
		},
		false,
		['encrypt', 'decrypt'],
	);
}

/**
 * AES-GCM cipher
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
 * Algorithm recommendations: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
 */
export class AESGCMCipher implements ICipher {
	private readonly ivSize = 96;

	private readonly key: Promise<CryptoKey>;
	constructor(cipher: string, salt: Uint8Array) {
		this.key = getDerivedKey(cipher, salt);
	}

	public async encrypt(buffer: ArrayBuffer) {
		const key = await this.key;

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
			key,
			buffer,
		);

		// Include public parameters to a cipher-buffer
		return joinBuffers([iv, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const key = await this.key;

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
				key,
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
