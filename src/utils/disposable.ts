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

export class DisposableBox<T> {
	private readonly data;
	private readonly cleanup;
	private readonly controller;
	constructor(data: T, cleanup?: () => void | Promise<void>) {
		this.data = data;
		this.cleanup = cleanup;
		this.controller = new Terminable();
	}

	public getContent() {
		this.controller.throwErrorIfTerminated();
		return this.data;
	}

	public async dispose() {
		if (this.cleanup) {
			await this.cleanup();
		}

		this.controller.terminate();
		(this as any).data = null;
	}

	public isDisposed() {
		return this.controller.isTerminated();
	}
}
