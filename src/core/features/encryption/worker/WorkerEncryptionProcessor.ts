import { transfer, wrap } from 'comlink';
import { Terminable } from '@utils/disposable';

import { IEncryptionProcessor } from '../../../encryption';

import { EncryptionWorker, EncryptionWorkerConfig } from '.';

/**
 * Transparent proxy an encryption requests to a worker
 * Useful to prevent main thread blocking for a long-term cryptographic operations
 */
export class WorkerEncryptionProcessor implements IEncryptionProcessor {
	private readonly state;
	constructor(config: EncryptionWorkerConfig) {
		const worker = new Worker(
			/* webpackChunkName: "Encryption.worker" */ new URL(
				'./Encryption.worker',
				import.meta.url,
			),
			{ type: 'module' },
		);
		const api = wrap<EncryptionWorker>(worker);

		this.state = api.init(config).then(() => ({ api, worker }));
	}

	public async load() {
		this.terminateStatus.throwErrorIfTerminated();
		await this.state;
	}

	public async encrypt(buffer: ArrayBuffer) {
		this.terminateStatus.throwErrorIfTerminated();
		const { api } = await this.state;

		return api.encrypt(transfer(buffer, [buffer])) as Promise<ArrayBuffer>;
	}

	public async decrypt(buffer: ArrayBuffer) {
		this.terminateStatus.throwErrorIfTerminated();
		const { api } = await this.state;

		return api.decrypt(transfer(buffer, [buffer])) as Promise<ArrayBuffer>;
	}

	private readonly terminateStatus = new Terminable();
	public async terminate() {
		this.terminateStatus.terminate();

		const { worker } = await this.state;
		worker.terminate();
	}
}
