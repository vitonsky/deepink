import { randomUUID } from 'crypto';
import { EventProps, Plausible } from 'plausible-client';
import { z } from 'zod';

import { IFileController } from '../files';
import { StateFile } from './StateFile';

const StateScheme = z.object({
	uid: z.string(),
	queue: z
		.object({
			name: z.string(),
			props: z
				.record(
					z.string(),
					z.union([z.string(), z.number(), z.null(), z.undefined()]),
				)
				.optional(),
		})
		.array(),
});
export class Telemetry {
	private readonly stateFile;
	constructor(
		file: IFileController,
		private readonly plausible: Plausible,
		private readonly options: {
			contextProps?: EventProps['props'];
			onEventSent?: (event: { name: string; payload: EventProps['props'] }) => void;
		} = {},
	) {
		this.stateFile = new StateFile(file, StateScheme, {
			defaultValue: {
				uid: randomUUID(),
				queue: [],
			},
		});
	}

	public async track(eventName: string, payload: EventProps['props'] = {}) {
		const { uid } = await this.getState();

		// Extend properties
		const composedPayload = {
			...this.options.contextProps,
			...payload,
			uid,
		};

		try {
			await this.plausible.trackEvent(eventName, {
				props: composedPayload,
			});

			this.options.onEventSent?.({ name: eventName, payload: composedPayload });
		} catch (error) {
			console.error(error);

			// Schedule sending event later
			await this.enqueue(eventName, composedPayload);
		}
	}

	public async handleQueue() {
		const state = await this.getState();

		const newQueue: z.TypeOf<typeof StateScheme>['queue'] = [];
		for (const event of state.queue) {
			try {
				await this.plausible.trackEvent(event.name, { props: event.props });

				this.options.onEventSent?.({ name: event.name, payload: event.props });
			} catch (error) {
				newQueue.push(event);
			}
		}

		// Nothing have sent
		const stats = {
			total: state.queue.length,
			processed: state.queue.length - newQueue.length,
		};

		// Sync if have any changes
		if (stats.processed > 0) {
			await this.sync({ ...state, queue: newQueue });
		}

		return stats;
	}

	private async enqueue(eventName: string, payload: EventProps['props'] = {}) {
		const state = await this.getState();

		state.queue.push({
			name: eventName,
			props: payload,
		});

		this.state = state;
		await this.sync(state);
	}

	private state: z.TypeOf<typeof StateScheme> | null = null;
	async getState() {
		if (this.state) return structuredClone(this.state);

		const state = await this.stateFile.get({ onError: console.error });
		await this.sync(state);

		return structuredClone(state);
	}

	private async sync(data: z.TypeOf<typeof StateScheme>) {
		this.state = data;
		await this.stateFile.set(data);
	}
}
