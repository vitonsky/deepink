import { DisposableBox } from '@utils/disposable';

import { EncryptionController } from '../../encryption/EncryptionController';

import { WorkerEncryptionProxyProcessor } from './workers/WorkerEncryptionProxyProcessor';

/**
 * Encryption entrypoint for application
 *
 * This component encapsulates all details of encryption implementation
 */
export const createEncryption = async (authData: {
	key: string | ArrayBuffer;
	salt: ArrayBuffer;
}): Promise<DisposableBox<EncryptionController>> => {
	const workerEncryption = new WorkerEncryptionProxyProcessor(
		authData.key,
		authData.salt,
	);
	const encryptionController = new EncryptionController(workerEncryption);

	return new DisposableBox(encryptionController, () => {
		workerEncryption.terminate();
	});
};
