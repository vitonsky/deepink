import { createEvent } from 'effector';
import z from 'zod';
import { PGliteWorker, PGliteWorkerOptions } from '@electric-sql/pglite/worker';

import { EventsMap } from './ExtendedPGLite';

export type WorkerEventPayload = {
	[K in keyof EventsMap]: {
		name: K;
		data: EventsMap[K];
	};
}[keyof EventsMap];

export const WorkerEventMessageScheme = z.object({
	type: z.literal('worker.event'),
	event: z.object({
		name: z.string(),
		data: z.any(),
	}),
});

export class ExtendedPGliteWorker extends PGliteWorker {
	constructor(worker: Worker, options?: PGliteWorkerOptions) {
		super(worker, options);

		worker.addEventListener('message', (event) => {
			// console.log('>>DBG', event.data);

			const { data } = WorkerEventMessageScheme.safeParse(event.data);

			if (!data) return;

			this.onEvent(data.event as WorkerEventPayload);
		});
	}

	private readonly onEvent = createEvent<WorkerEventPayload>();

	public on<T extends keyof EventsMap>(
		eventName: T,
		callback: (payload: EventsMap[T]) => void,
		{ once = false }: { once?: boolean } = {},
	) {
		const cleanup = this.onEvent
			.filter({ fn: (payload) => payload.name === eventName })
			.watch((event) => {
				if (once) {
					cleanup.unsubscribe();
				}

				callback(event.data);
			});

		return cleanup;
	}
}
