import { WorkerMessenger } from '../workers/utils';
import { ICipher } from '.';

export class WorkerEncryptionController implements ICipher {
	private readonly worker;
	private readonly messanger;
	constructor(secretKey: string, salt: ArrayBuffer) {
		const worker = new Worker('./cryptographyWorker.js');

		this.messanger = new WorkerMessenger(worker);
		this.worker = this.messanger
			.sendMessage({ method: 'init', secretKey, salt })
			.then(() => worker);
	}

	public async encrypt(buffer: ArrayBuffer) {
		await this.worker;
		// console.log('E', buffer);
		return this.messanger.sendMessage({ method: 'encrypt', buffer }, [buffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		await this.worker;
		// console.log('D', buffer);
		return this.messanger.sendMessage({ method: 'decrypt', buffer }, [buffer]);
	}
}
