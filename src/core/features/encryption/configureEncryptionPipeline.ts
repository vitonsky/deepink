import z from 'zod';
import { AESCipher } from '@core/encryption/ciphers/AES';
import { ensureWasmIsLoaded, SerpentCipher } from '@core/encryption/ciphers/Serpent';
import { TwofishCTRCipher } from '@core/encryption/ciphers/Twofish';
import { XChaCha20Cipher } from '@core/encryption/ciphers/XChaCha20';
import { HKDFDerivedKeys } from '@core/encryption/utils/HKDFDerivedKeys';

import { EncryptionController } from '../../encryption/EncryptionController';
import { BufferIntegrityProcessor } from '../../encryption/processors/BufferIntegrityProcessor';
import { BufferSizeObfuscationProcessor } from '../../encryption/processors/BufferSizeObfuscationProcessor';
import { PipelineProcessor } from '../../encryption/processors/PipelineProcessor';
import { getRandomBytes } from '../../encryption/utils/random';

import { ENCRYPTION_ALGORITHM } from '.';

export const configureEncryptionPipeline = async (
	hkdf: HKDFDerivedKeys,
	algorithm: string,
) => {
	const cipherNames = z
		.string()
		.transform((s) => s.split('-'))
		.pipe(
			z
				.enum(ENCRYPTION_ALGORITHM, {
					error(info) {
						return `Invalid algorithm ${info.input}`;
					},
				})
				.array(),
		)
		.parse(algorithm);

	const ciphers = await Promise.all(
		cipherNames.map(async (cipherName, index) => {
			switch (cipherName) {
				case ENCRYPTION_ALGORITHM.AES: {
					const key = await hkdf.deriveBits(256, String(index));
					return new AESCipher(new Uint8Array(key), getRandomBytes);
				}
				case ENCRYPTION_ALGORITHM.TWOFISH: {
					const key = await hkdf.deriveBits(256, String(index));

					const cipher = new TwofishCTRCipher(
						new Uint8Array(key),
						getRandomBytes,
					);
					await cipher.load();
					return cipher;
				}
				case ENCRYPTION_ALGORITHM.SERPENT: {
					const key = await hkdf.deriveBits(256, String(index));

					await ensureWasmIsLoaded();
					return new SerpentCipher(new Uint8Array(key), getRandomBytes);
				}
				case ENCRYPTION_ALGORITHM.XChaCha20: {
					const key = await hkdf.deriveBits(256, String(index));
					return new XChaCha20Cipher(new Uint8Array(key), getRandomBytes);
				}

				default: {
					throw new Error(`Unknown cipher ${cipherName}`);
				}
			}
		}),
	);

	const hmacKey = await hkdf
		.deriveBits(256, 'hmac')
		.then((buffer) => new Uint8Array(buffer));

	return new EncryptionController(
		new PipelineProcessor([
			new BufferSizeObfuscationProcessor(getRandomBytes),
			...ciphers,
			new BufferIntegrityProcessor(hmacKey),
		]),
	);
};
