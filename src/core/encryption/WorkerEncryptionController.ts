import { WorkerMessenger } from '../../utils/workers/WorkerMessenger';
import { WorkerRPC } from '../../utils/workers/WorkerRPC';

import { convertBufferToTransferable } from './utils/buffers';
import { IEncryptionProcessor } from '.';

export class Terminable {
	private isFinished = false;

	public terminate() {
		this.isFinished = true;
	}
	public isTerminated() {
		return this.isFinished;
	}

	public throwErrorIfTerminated(message?: string) {
		const errorMessage =
			message ?? "Object been terminated and can't be used anymore";
		if (this.isFinished) throw new Error(errorMessage);
	}
}

export class WorkerEncryptionController implements IEncryptionProcessor {
	private readonly worker;
	private readonly messenger;
	private readonly requests;
	constructor(secretKey: string | ArrayBuffer, salt: ArrayBuffer) {
		const worker = new Worker('./cryptographyWorker.js');
		this.messenger = new WorkerMessenger(worker);
		this.requests = new WorkerRPC(this.messenger);
		this.worker = this.requests
			.sendRequest('init', { secretKey, salt })
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
