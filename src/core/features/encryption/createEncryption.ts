import { DisposableBox } from '@utils/disposable';

import { EncryptionController } from '../../encryption/EncryptionController';

import { EncryptionAlgorithm } from './EncryptionAlgorithm';
import { WorkerEncryptionProxyProcessor } from './workers/WorkerEncryptionProxyProcessor';

/**
 * Encryption entrypoint for application
 *
 * This component encapsulates all details of encryption implementation
 */
export const createEncryption = async (authData: {
	key: string | ArrayBuffer;
	salt: ArrayBuffer;
	algorithm: EncryptionAlgorithm;
}): Promise<DisposableBox<EncryptionController>> => {
	const workerEncryption = new WorkerEncryptionProxyProcessor({
		secretKey: authData.key,
		salt: authData.salt,
		algorithm: authData.algorithm,
	});
	const encryptionController = new EncryptionController(workerEncryption);

	return new DisposableBox(encryptionController, () => {
		workerEncryption.terminate();
	});
};
