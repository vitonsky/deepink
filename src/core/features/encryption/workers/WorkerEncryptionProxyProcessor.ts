import { transfer, wrap } from 'comlink';
import { Terminable } from '@utils/disposable';

import { IEncryptionProcessor } from '../../../encryption';

import { EncryptionConfig, EncryptionWorker } from '.';

/**
 * Transparent proxy an encryption requests to a worker
 * Useful to prevent main thread blocking for a long-term cryptographic operations
 */
export class WorkerEncryptionProxyProcessor implements IEncryptionProcessor {
	private readonly state;
	constructor(config: EncryptionConfig) {
		const worker = new Worker(
			/* webpackChunkName: "Cryptography.worker" */ new URL(
				'./Cryptography.worker',
				import.meta.url,
			),
			{ type: 'module' },
		);
		const api = wrap<EncryptionWorker>(worker);

		this.state = api.init(config).then(() => ({ api, worker }));
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
	public terminate() {
		this.terminateStatus.terminate();
		this.state.then((state) => {
			state.worker.terminate();
		});
	}
}
