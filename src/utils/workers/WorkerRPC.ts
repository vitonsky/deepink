import { ResponseCallback, WorkerMessenger } from './WorkerMessenger';

type RequestPayload<T = any> = {
	type: 'request' | 'response';
	channel: string;
	payload: T;
};

// TODO: implement timeout
// TODO: reject requests with not registered handlers
export class WorkerRPC {
	private readonly messenger;
	constructor(messenger: WorkerMessenger) {
		this.messenger = messenger;
	}

	public sendRequest(channel: string, payload: any, transferObjects?: Transferable[]) {
		const message: RequestPayload = {
			type: 'request',
			channel,
			payload,
		};

		return this.messenger
			.sendRequest(message, transferObjects)
			.then((message: RequestPayload) => {
				// TODO: validate data
				if (message.type !== 'response') return;

				return message.payload;
			});
	}

	public addHandler(
		channel: string,
		handler: (data: any, response: ResponseCallback) => any,
	) {
		const cleanup = this.messenger.onMessage(
			async (data: RequestPayload, response) => {
				// TODO: validate data
				if (typeof data !== 'object' || data.channel !== channel) return;

				let isResponded = false;
				const responseProxy: ResponseCallback = (payload, transferObjects) => {
					const message: RequestPayload = {
						type: 'response',
						channel,
						payload,
					};

					const result = response(message, transferObjects);

					// Mark as responded in case function complete successful
					isResponded = true;

					return result;
				};

				try {
					await handler(data.payload, responseProxy);
					if (!isResponded) {
						responseProxy(undefined);
					}
				} catch (err) {
					if (!isResponded) {
						console.warn('Request did not responded', { channel });
					}
					throw err;
				}
			},
		);

		return cleanup;
	}
}
