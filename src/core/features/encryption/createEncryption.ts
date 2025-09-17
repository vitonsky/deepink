import { DisposableBox } from '@utils/disposable';

import { EncryptionController } from '../../encryption/EncryptionController';

import {
	EncryptionConfig,
	WorkerEncryptionProxyProcessor,
} from './workers/WorkerEncryptionProxyProcessor';

/**
 * Encryption entrypoint for application
 *
 * This component encapsulates all details of encryption implementation
 */
export const createEncryption = async (
	authData: EncryptionConfig,
): Promise<DisposableBox<EncryptionController>> => {
	const workerEncryption = new WorkerEncryptionProxyProcessor(authData);
	const encryptionController = new EncryptionController(workerEncryption);

	return new DisposableBox(encryptionController, () => {
		workerEncryption.terminate();
	});
};
