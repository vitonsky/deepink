import { randomUUID } from 'crypto';
import { EventProps, Plausible } from 'plausible-client';
import { z } from 'zod';

import { IFileController } from '../files';

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
	constructor(
		private readonly file: IFileController,
		private readonly plausible: Plausible,
	) {}

	public async track(eventName: string, payload: EventProps['props'] = {}) {
		const { uid } = await this.getState();

		// Extend properties
		payload = {
			...payload,
			uid,
		};

		try {
			await this.plausible.trackEvent(eventName, { props: payload });
		} catch (error) {
			console.error(error);

			// Schedule sending event later
			await this.enqueue(eventName, payload);
		}
	}

	public async handleQueue() {
		const state = await this.getState();

		const newQueue: z.TypeOf<typeof StateScheme>['queue'] = [];
		for (const event of state.queue) {
			try {
				await this.plausible.trackEvent(event.name, { props: event.props });
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

		// Parse data in state file
		const rawJson = await this.file.get();
		if (rawJson) {
			try {
				const parseResult = StateScheme.safeParse(
					JSON.parse(new TextDecoder().decode(rawJson)),
				);
				if (parseResult.success) return parseResult.data;
			} catch (error) {
				console.error(error);
			}
		}

		// Create new state file
		const newState = {
			uid: randomUUID(),
			queue: [],
		} satisfies z.TypeOf<typeof StateScheme>;

		this.state = newState;
		await this.sync(newState);

		return structuredClone(newState);
	}

	private async sync(data: z.TypeOf<typeof StateScheme>) {
		this.state = data;
		await this.file.write(new TextEncoder().encode(JSON.stringify(data)).buffer);
	}
}
