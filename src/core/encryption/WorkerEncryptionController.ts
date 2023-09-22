import { WorkerMessenger, WorkerRequests } from '../workers/utils';
import { ICipher } from '.';

export class Terminable {
	private isTerminated = false;
	public terminate() {
		this.isTerminated = true;
	}

	public throwErrorIfTerminated(message?: string) {
		const errorMessage =
			message ?? "Object been terminated and can't be used anymore";
		if (this.isTerminated) throw new Error(errorMessage);
	}
}

export class WorkerEncryptionController implements ICipher {
	private readonly worker;
	private readonly messenger;
	private readonly requests;
	constructor(secretKey: string, salt: ArrayBuffer) {
		const worker = new Worker('./cryptographyWorker.js');
		this.messenger = new WorkerMessenger(worker);
		this.requests = new WorkerRequests(this.messenger);
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
