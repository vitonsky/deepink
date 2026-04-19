import { Endpoint, expose, transfer } from 'comlink';
import { HKDFDerivedKeys } from '@core/encryption/utils/HKDFDerivedKeys';

import { EncryptionController } from '../../../encryption/EncryptionController';

import { configureEncryptionPipeline } from '../configureEncryptionPipeline';
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

			encryptionController = await configureEncryptionPipeline(
				new HKDFDerivedKeys(key, salt),
				algorithm,
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
