import { Terminable } from '../core/encryption/WorkerEncryptionController';

export class DisposableBox<T> {
	private readonly data;
	private readonly cleanup;
	private readonly controller;
	constructor(data: T, cleanup?: () => void) {
		this.data = data;
		this.cleanup = cleanup;
		this.controller = new Terminable();
	}

	public getContent() {
		this.controller.throwErrorIfTerminated();
		return this.data;
	}

	public dispose() {
		if (this.cleanup) {
			this.cleanup();
		}

		this.controller.terminate();
		(this as any).data = null;
	}

	public isDisposed() {
		return this.controller.isTerminated();
	}
}
