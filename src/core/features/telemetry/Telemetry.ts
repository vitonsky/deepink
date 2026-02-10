import { randomUUID } from 'crypto';
import { z } from 'zod';

import { IFileController } from '../files';
import { StateFile } from '../files/StateFile';
import { EventPayload, EventTracker } from '.';

const StateScheme = z.object({
	uid: z.string(),
	queue: z
		.object({
			name: z.string(),
			props: z.record(z.string(), z.any()).optional(),
		})
		.array(),
});

export interface TelemetryTracker {
	track(eventName: string, payload?: EventPayload): Promise<void>;

	handleQueue(): Promise<{
		total: number;
		processed: number;
	}>;

	getState(): Promise<z.TypeOf<typeof StateScheme>>;
}

export class Telemetry implements TelemetryTracker {
	private readonly stateFile;
	constructor(
		file: IFileController,
		private readonly eventTracker: EventTracker,
		private readonly options: {
			contextProps?: () => EventPayload | Promise<EventPayload>;
			onEventSent?: (event: { name: string; payload: EventPayload }) => void;
		} = {},
	) {
		this.stateFile = new StateFile(file, StateScheme, {
			defaultValue: {
				uid: randomUUID(),
				queue: [],
			},
		});
	}

	public async track(eventName: string, payload: EventPayload = {}) {
		const { uid } = await this.getState();

		// Extend properties
		const contextProps = this.options.contextProps
			? await this.options.contextProps()
			: {};
		const composedPayload = {
			...contextProps,
			...payload,
			uid,
		};

		try {
			await this.eventTracker.sendEvent(eventName, composedPayload);

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
				await this.eventTracker.sendEvent(event.name, event.props);

				this.options.onEventSent?.({
					name: event.name,
					payload: event.props ?? {},
				});
			} catch (_error) {
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

	private async enqueue(eventName: string, payload: EventPayload = {}) {
		const state = await this.getState();

		state.queue.push({
			name: eventName,
			props: payload,
		});

		this.state = state;
		await this.sync(state);
	}

	private state: z.TypeOf<typeof StateScheme> | null = null;
	public async getState() {
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
