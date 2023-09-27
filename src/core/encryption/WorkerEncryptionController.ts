import { WorkerMessenger } from '../../utils/workers/WorkerMessenger';
import { WorkerRPC } from '../../utils/workers/WorkerRPC';

import { ICipher } from '.';

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

export class WorkerEncryptionController implements ICipher {
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
		return this.requests.sendRequest('encrypt', buffer, [buffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		this.terminateStatus.throwErrorIfTerminated();

		await this.worker;
		return this.requests.sendRequest('decrypt', buffer, [buffer]);
	}

	private readonly terminateStatus = new Terminable();
	public terminate() {
		this.messenger.destroy();
		this.terminateStatus.terminate();
	}
}
