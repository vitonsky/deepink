import { bytes, struct } from '@core/encryption/utils/bytes/binstruct';
import { HKDFDerivedKeys } from '@core/encryption/utils/HKDFDerivedKeys';

import { IntegrityError } from '../../processors/BufferIntegrityProcessor';
import { joinBuffers } from '../../utils/buffers';

import { IEncryptionProcessor, RandomBytesGenerator } from '../..';

const AESHeader = struct({
	iv: bytes(32),
});

/**
 * AES-CTR cipher
 * MDN: https://developer.mozilla.org/en-US/docs/Web/API/AesCtrParams
 * Algorithm recommendations: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
 */
export class AESCipher implements IEncryptionProcessor {
	constructor(
		private readonly key: Uint8Array<ArrayBuffer>,
		private readonly randomBytesGenerator: RandomBytesGenerator,
	) {}

	public async encrypt(buffer: ArrayBuffer) {
		const iv = this.randomBytesGenerator(32);

		const hkdf = new HKDFDerivedKeys(this.key, iv);
		const [key, messageIV] = await Promise.all([
			hkdf
				.deriveBytes(32, 'msg')
				.then((key) =>
					crypto.subtle.importKey('raw', key, 'AES-CTR', false, [
						'encrypt',
						'decrypt',
					]),
				),
			hkdf.deriveBytes(16, 'iv'),
		]);

		const encryptedBuffer = await self.crypto.subtle.encrypt(
			{
				name: 'AES-CTR',
				counter: messageIV,
				length: 64,
			},
			key,
			buffer,
		);

		// Include public parameters to a cipher-buffer
		return joinBuffers([AESHeader.encode({ iv }), encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { iv } = AESHeader.decode(new Uint8Array(buffer, 0, AESHeader.size));

		const hkdf = new HKDFDerivedKeys(this.key, new Uint8Array(iv));
		const [key, messageIV] = await Promise.all([
			hkdf
				.deriveBytes(32, 'msg')
				.then((key) =>
					crypto.subtle.importKey('raw', key, 'AES-CTR', false, [
						'encrypt',
						'decrypt',
					]),
				),
			hkdf.deriveBytes(16, 'iv'),
		]);

		return self.crypto.subtle
			.decrypt(
				{
					name: 'AES-CTR',
					counter: messageIV,
					length: 64,
				},
				key,
				new Uint8Array(buffer, AESHeader.size),
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
