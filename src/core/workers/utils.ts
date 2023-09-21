let idCounter = 0;

type PostMessageParams<D = any> = {
	data: D;
	transferObjects?: Transferable[];
};

// TODO: specify structure for data payload
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
		const payload = {
			id: responseTo ?? messageId,
			data,
		};

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
				const data = evt.data;

				// Handle only response on sent message
				if (data.id === messageId) {
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
			const data = evt.data;

			callback(data.data, (data, transferObjects) => {
				const requestId = data.id;
				this.postMessage({ data, transferObjects }, requestId);
			});
		});
	}
}
