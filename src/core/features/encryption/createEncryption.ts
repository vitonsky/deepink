import { DisposableBox } from '@utils/disposable';

import { EncryptionController } from '../../encryption/EncryptionController';

import { EncryptionConfig } from './worker';
import { WorkerEncryptionProcessor } from './worker/WorkerEncryptionProcessor';

/**
 * Encryption entrypoint for application
 *
 * This component encapsulates all details of encryption implementation
 */
export const createEncryption = async (
	authData: EncryptionConfig,
): Promise<DisposableBox<EncryptionController>> => {
	const workerEncryption = new WorkerEncryptionProcessor(authData);
	const encryptionController = new EncryptionController(workerEncryption);

	return new DisposableBox(encryptionController, () => {
		workerEncryption.terminate();
	});
};
