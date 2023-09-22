let idCounter = 0;

type PostMessageParams<D = any> = {
	data: D;
	transferObjects?: Transferable[];
};

type MessagePayload<T = any> = {
	id: number;
	data: T;
	responseTarget?: number;
};

type ResponseCallback = (data: any, transferObjects?: Transferable[]) => void;

// TODO: implement method to register request handlers
// TODO: reject requests with not registered handlers
export class WorkerMessenger {
	private readonly target;
	constructor(target: Worker | Window) {
		this.target = target;
	}

	private postMessage(
		{ data, transferObjects }: PostMessageParams,
		responseTo?: number,
	) {
		const messageId = ++idCounter;
		const payload: MessagePayload = {
			id: messageId,
			data,
		};

		if (responseTo) {
			payload.responseTarget = responseTo;
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
				if (data.responseTarget === messageId) {
					(this.target as Worker).removeEventListener('message', onMessage);
					resolve(data.data);
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
			callback(data.data, (data, transferObjects) => {
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
	public destroy() {
		if (this.target instanceof Worker) {
			console.warn('Terminate worker!!');
			this.target.terminate();
		}

		this.cleanupCallbacks.forEach((cleanup) => cleanup());
	}
}

type CleanupCallback = () => void;
type RequestPayload<T = any> = {
	type: 'request' | 'response';
	channel: string;
	data: T;
};

export class WorkerRequests {
	readonly messenger;
	constructor(messenger: WorkerMessenger) {
		this.messenger = messenger;
	}

	public sendRequest(channel: string, data: any, transferObjects?: Transferable[]) {
		const message: RequestPayload = {
			type: 'request',
			channel,
			data,
		};
		return this.messenger
			.sendRequest(message, transferObjects)
			.then((message: RequestPayload) => {
				if (message.type !== 'response') return;

				return message.data;
			});
	}

	public addHandler(
		channel: string,
		handler: (data: any, response: ResponseCallback) => any,
	) {
		const cleanup = this.messenger.onMessage(
			async (data: RequestPayload, response) => {
				if (typeof data !== 'object' || data.channel !== channel) return;

				let isResponded = false;
				const responseProxy: ResponseCallback = (payload, transferObjects) => {
					const message: RequestPayload = {
						type: 'response',
						channel,
						data: payload,
					};

					const result = response(message, transferObjects);

					// Mark as responded in case function complete successful
					isResponded = true;

					return result;
				};

				try {
					await handler(data.data, responseProxy);
					if (!isResponded) {
						responseProxy(undefined);
					}
				} catch (err) {
					if (!isResponded) {
						console.warn('Request did not responded', { channel });
					}
				}
			},
		);

		return cleanup;
	}
}
