import { ResponseCallback, WorkerMessenger } from './WorkerMessenger';

type RPCMessage = {
	channel: string;
};

type RPCRequest<T = any> = RPCMessage & {
	type: 'request';
	payload: T;
};

type RPCResponse<T = any> = RPCMessage & {
	type: 'response';
} & (
		| {
				status: 'ok';
				payload?: T;
		  }
		| {
				status: 'error';
				error: any;
		  }
	);

// TODO: implement timeout
// TODO: reject requests with not registered handlers
export class WorkerRPC {
	private readonly messenger;
	constructor(messenger: WorkerMessenger) {
		this.messenger = messenger;
	}

	public sendRequest(channel: string, payload: any, transferObjects?: Transferable[]) {
		const message: RPCRequest = {
			type: 'request',
			channel,
			payload,
		};

		return this.messenger
			.sendRequest(message, transferObjects)
			.then((message: RPCResponse) => {
				// TODO: validate data
				if (message.type !== 'response') return;
				if (message.status === 'error') {
					const errorToReturn = message.error ?? new Error('Unknown error');
					throw errorToReturn;
				}

				return message.payload;
			});
	}

	public addHandler(
		channel: string,
		handler: (data: any, response: ResponseCallback) => any,
	) {
		const cleanup = this.messenger.onMessage(async (data: RPCRequest, response) => {
			// TODO: validate data
			if (typeof data !== 'object' || data.channel !== channel) return;

			let isResponded = false;
			const responseProxy: ResponseCallback = (payload, transferObjects) => {
				const message: RPCResponse = {
					channel,
					type: 'response',
					status: 'ok',
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
				// Respond with error in case response still not been sent
				if (!isResponded) {
					console.warn('Request did not responded', { channel });

					const message: RPCResponse = {
						channel,
						type: 'response',
						status: 'error',
						error: err,
					};

					response(message);
				}

				throw err;
			}
		});

		return cleanup;
	}
}
