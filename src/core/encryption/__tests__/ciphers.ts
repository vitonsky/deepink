import { ENCRYPTION_ALGORITHM } from '@core/features/encryption';
import { formatAlgorithms } from '@core/features/encryption/utils';

import { AESCipher } from '../ciphers/AES';
import { SeprentCipher } from '../ciphers/Serpent';
import { WasmTwofishCTRCipher } from '../ciphers/Twofish';
import { XChaCha20Cipher } from '../ciphers/XChaCha20';
import { BufferIntegrityProcessor } from '../processors/BufferIntegrityProcessor';
import { PipelineProcessor } from '../processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from '../utils/keys';
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
			const salt = new Uint8Array(32);
			const derivedKeys = await getMasterKey(key.buffer, salt.buffer).then(
				(masterKey) => getDerivedKeysManager(masterKey, salt),
			);

			return new PipelineProcessor([
				new BufferIntegrityProcessor(
					await derivedKeys
						.getDerivedBits('hmac', 256)
						.then((buffer) => new Uint8Array(buffer)),
				),
				...(await Promise.all([
					derivedKeys
						.getDerivedBits('AES', 32 * 8)
						.then((key) => new AESCipher(new Uint8Array(key), randomBytes)),
					derivedKeys
						.getDerivedBits('Twofish', 32 * 8)
						.then(
							(key) =>
								new WasmTwofishCTRCipher(
									new Uint8Array(key),
									randomBytes,
								),
						),
					derivedKeys
						.getDerivedBits('Serpent', 32 * 8)
						.then(
							(key) => new SeprentCipher(new Uint8Array(key), randomBytes),
						),
				])),
			]);
		},
	},
];
