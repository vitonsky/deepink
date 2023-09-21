let idCounter = 0;

export class WorkerMessenger {
	private readonly target;
	constructor(target: Worker | Window) {
		this.target = target;
	}

	// send request
	public async sendMessage(
		data: any,
		transferObjects?: Transferable[],
		respondId?: number,
	) {
		const messageId = ++idCounter;
		return new Promise<any>((resolve) => {
			// Send message
			if (this.target instanceof Worker) {
				this.target.postMessage(
					{
						id: respondId ?? messageId,
						data,
					},
					transferObjects ?? [],
				);
			} else {
				this.target.postMessage(
					{
						id: respondId ?? messageId,
						data,
					},
					{
						transfer: transferObjects,
					},
				);
			}

			if (respondId !== undefined) {
				(resolve as any)();
				return;
			}

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

	public async onMessage(
		callback: (
			data: any,
			response: (data: any, transferObjects?: Transferable[]) => void,
		) => void,
	) {
		(this.target as Worker).addEventListener('message', (evt) => {
			const data = evt.data;

			callback(data.data, (data, transferObjects) => {
				this.sendMessage(data, transferObjects, data.id);
			});
		});
	}
}
