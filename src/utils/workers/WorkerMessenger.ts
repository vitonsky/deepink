import { CleanupCallback } from '.';

export type PostMessageParams<D = any> = {
	data: D;
	transferObjects?: Transferable[];
};

export type MessagePayload<T = any> = {
	/**
	 * Message unique id
	 */
	id: number;

	/**
	 * Id of message for response
	 */
	responseFor?: number;

	/**
	 * Message payload
	 */
	payload: T;
};

export type ResponseCallback = (data: any, transferObjects?: Transferable[]) => void;

let idCounter = 0;

export class WorkerMessenger {
	private readonly target;
	constructor(target: Worker | Window) {
		this.target = target;
	}

	private postMessage(
		{ data, transferObjects }: PostMessageParams,
		responseFor?: number,
	) {
		const messageId = ++idCounter;
		const payload: MessagePayload = {
			id: messageId,
			payload: data,
		};

		// Set only if exists
		if (responseFor) {
			payload.responseFor = responseFor;
		}

		// Send message
		if (this.target instanceof Worker) {
			this.target.postMessage(payload, transferObjects ?? []);
		} else {
			this.target.postMessage(payload, {
				transfer: transferObjects,
			});
		}

		return messageId;
	}

	/**
	 * Send message with no wait a response
	 */
	public sendMessage(data: any, transferObjects?: Transferable[]) {
		return this.postMessage({ data, transferObjects });
	}

	/**
	 * Send message and wait a response
	 */
	public async sendRequest(data: any, transferObjects?: Transferable[]) {
		return new Promise<any>((resolve) => {
			const messageId = this.postMessage({ data, transferObjects });

			const onMessage = (evt: MessageEvent) => {
				// TODO: validate structure and skip other messages
				const data = evt.data as MessagePayload;

				// Handle only response on sent message
				if (data.responseFor === messageId) {
					(this.target as Worker).removeEventListener('message', onMessage);
					resolve(data.payload);
				}
			};

			(this.target as Worker).addEventListener('message', onMessage);
		});
	}

	/**
	 * Listen messages
	 */
	public onMessage(callback: (data: any, response: ResponseCallback) => void) {
		const onMessage = (evt: MessageEvent) => {
			// TODO: validate structure and skip other messages
			const data = evt.data as MessagePayload;

			const requestId = data.id;
			callback(data.payload, (data, transferObjects) => {
				this.postMessage({ data, transferObjects }, requestId);
			});
		};

		(this.target as Worker).addEventListener('message', onMessage);

		const cleanup = () => {
			(this.target as Worker).removeEventListener('message', onMessage);
			this.cleanupCallbacks = this.cleanupCallbacks.filter((cb) => cb !== cleanup);
		};

		this.cleanupCallbacks.push(cleanup);

		return cleanup;
	}

	private cleanupCallbacks: CleanupCallback[] = [];

	/**
	 * Terminate session
	 *
	 * Object must not be used after termination
	 */
	public destroy() {
		if (this.target instanceof Worker) {
			this.target.terminate();
		}

		this.cleanupCallbacks.forEach((cleanup) => cleanup());
	}
}
