import { Endpoint, expose, transfer } from 'comlink';
import { IEncryptionProcessor } from '@core/encryption';
import { AESGCMCipher } from '@core/encryption/ciphers/AES';
import { TwofishCTRCipher } from '@core/encryption/ciphers/Twofish';

import { EncryptionController } from '../../../encryption/EncryptionController';
import { BufferIntegrityProcessor } from '../../../encryption/processors/BufferIntegrityProcessor';
import { BufferSizeObfuscationProcessor } from '../../../encryption/processors/BufferSizeObfuscationProcessor';
import { PipelineProcessor } from '../../../encryption/processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from '../../../encryption/utils/keys';
import { getRandomBytes } from '../../../encryption/utils/random';

import { parseAlgorithms } from '../utils';
import { ENCRYPTION_ALGORITHM } from '..';
import { EncryptionWorker } from '.';

const workerId = Date.now();
let encryptionController: EncryptionController | null = null;
expose(
	{
		async init({ key, salt, algorithm, disablePulse }) {
			if (!disablePulse) {
				// Ping for debug purposes, to make encryption thread visible
				self.setInterval(() => console.debug('Worker pulse', workerId), 1000);
			}

			const derivedKeys = await getMasterKey(key, salt).then((masterKey) =>
				getDerivedKeysManager(masterKey, new Uint8Array(salt)),
			);

			const cipherMap: Record<
				ENCRYPTION_ALGORITHM,
				() => Promise<IEncryptionProcessor>
			> = {
				[ENCRYPTION_ALGORITHM.AES]: async () => {
					const key = await derivedKeys.getDerivedKey('aes-gcm-cipher', {
						name: 'AES-GCM',
						length: 256,
					});
					return new AESGCMCipher(key, getRandomBytes);
				},
				[ENCRYPTION_ALGORITHM.TWOFISH]: async () => {
					const key = await derivedKeys.getDerivedBytes(
						'twofish-ctr-cipher',
						256,
					);
					return new TwofishCTRCipher(new Uint8Array(key), getRandomBytes);
				},
			};

			const ciphers = await Promise.all(
				parseAlgorithms(algorithm).map((name) => cipherMap[name]()),
			);

			encryptionController = new EncryptionController(
				new PipelineProcessor([
					new BufferIntegrityProcessor(),
					new BufferSizeObfuscationProcessor(getRandomBytes),
					...ciphers,
				]),
			);
		},

		async encrypt(rawData) {
			if (!encryptionController)
				throw new Error('Encryption is not initialized yet');

			const result = await encryptionController.encrypt(rawData);
			return transfer(result, [result]);
		},

		async decrypt(encryptedData) {
			if (!encryptionController)
				throw new Error('Encryption is not initialized yet');

			const result = await encryptionController.decrypt(encryptedData);
			return transfer(result, [result]);
		},
	} satisfies EncryptionWorker,
	self as Endpoint,
);
