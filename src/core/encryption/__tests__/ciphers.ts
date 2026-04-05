import { ENCRYPTION_ALGORITHM } from '@core/features/encryption';
import { formatAlgorithms } from '@core/features/encryption/utils';

import { AESCipher } from '../ciphers/AES';
import { SeprentCipher } from '../ciphers/Serpent';
import { WasmTwofishCTRCipher } from '../ciphers/Twofish';
import { XChaCha20Cipher } from '../ciphers/XChaCha20';
import { BufferIntegrityProcessor } from '../processors/BufferIntegrityProcessor';
import { PipelineProcessor } from '../processors/PipelineProcessor';
import { HKDFDerivedKeys } from '../utils/HKDFDerivedKeys';
import { IEncryptionProcessor, RandomBytesGenerator } from '..';

export const ciphers: {
	name: string;
	create(
		key: Uint8Array<ArrayBuffer>,
		randomBytes: RandomBytesGenerator,
	): Promise<IEncryptionProcessor>;
}[] = [
	{
		name: ENCRYPTION_ALGORITHM.AES,
		async create(key, randomBytes) {
			return new AESCipher(key, randomBytes);
		},
	},
	{
		name: ENCRYPTION_ALGORITHM.TWOFISH,
		async create(key, randomBytes) {
			return new WasmTwofishCTRCipher(key, randomBytes);
		},
	},
	{
		name: ENCRYPTION_ALGORITHM.SERPENT,
		async create(key, randomBytes) {
			return new SeprentCipher(key, randomBytes);
		},
	},
	{
		name: ENCRYPTION_ALGORITHM.XChaCha20,
		async create(key, randomBytes) {
			return new XChaCha20Cipher(key, randomBytes);
		},
	},
	{
		name: formatAlgorithms([
			ENCRYPTION_ALGORITHM.AES,
			ENCRYPTION_ALGORITHM.TWOFISH,
			ENCRYPTION_ALGORITHM.SERPENT,
		]),
		async create(key, randomBytes) {
			const hkdf = new HKDFDerivedKeys(key, new Uint8Array(32));

			const [hmac, aes, twofish, serpent] = await Promise.all([
				hkdf.deriveBytes(32, 'hmac'),
				hkdf.deriveBytes(32, 'aes'),
				hkdf.deriveBytes(32, 'twofish'),
				hkdf.deriveBytes(32, 'serpent'),
			]);

			return new PipelineProcessor([
				new BufferIntegrityProcessor(hmac),
				new AESCipher(aes, randomBytes),
				new WasmTwofishCTRCipher(twofish, randomBytes),
				new SeprentCipher(serpent, randomBytes),
			]);
		},
	},
];
