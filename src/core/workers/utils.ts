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
	public async onMessage(
		callback: (
			data: any,
			response: (data: any, transferObjects?: Transferable[]) => void,
		) => void,
	) {
		(this.target as Worker).addEventListener('message', (evt) => {
			// TODO: validate structure and skip other messages
			const data = evt.data as MessagePayload;

			const requestId = data.id;
			callback(data.data, (data, transferObjects) => {
				this.postMessage({ data, transferObjects }, requestId);
			});
		});
	}
}
