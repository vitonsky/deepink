import { Terminable } from '@utils/disposable';
import { WorkerMessenger } from '@utils/workers/WorkerMessenger';
import { WorkerRPC } from '@utils/workers/WorkerRPC';

import { IEncryptionProcessor } from '../../../encryption';
import { convertBufferToTransferable } from '../../../encryption/utils/buffers';

import { ENCRYPTION_ALGORITHM } from '../algorithms';
import EncryptionWorker from './Cryptography.worker';

export type EncryptionConfig = {
	key: string | ArrayBuffer;
	salt: ArrayBuffer;
	algorithm: ENCRYPTION_ALGORITHM;
};

/**
 * Transparent proxy an encryption requests to a worker
 * Useful to prevent main thread blocking for a long-term cryptographic operations
 */
export class WorkerEncryptionProxyProcessor implements IEncryptionProcessor {
	private readonly worker;
	private readonly messenger;
	private readonly requests;
	constructor({ key, salt, algorithm }: EncryptionConfig) {
		const worker = new EncryptionWorker();
		this.messenger = new WorkerMessenger(worker);
		this.requests = new WorkerRPC(this.messenger);
		this.worker = this.requests
			.sendRequest('init', { key, salt, algorithm })
			.then(() => worker);
	}

	public async encrypt(buffer: ArrayBuffer) {
		this.terminateStatus.throwErrorIfTerminated();

		await this.worker;

		const [transferableBuffer, convertBufferBack] =
			convertBufferToTransferable(buffer);
		return this.requests
			.sendRequest('encrypt', transferableBuffer, [transferableBuffer])
			.then(convertBufferBack);
	}

	public async decrypt(buffer: ArrayBuffer) {
		this.terminateStatus.throwErrorIfTerminated();

		await this.worker;

		const [transferableBuffer, convertBufferBack] =
			convertBufferToTransferable(buffer);
		return this.requests
			.sendRequest('decrypt', transferableBuffer, [transferableBuffer])
			.then(convertBufferBack);
	}

	private readonly terminateStatus = new Terminable();
	public terminate() {
		this.messenger.destroy();
		this.terminateStatus.terminate();
	}
}
