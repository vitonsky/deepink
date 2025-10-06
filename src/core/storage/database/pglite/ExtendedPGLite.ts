import { createEvent, EventCallable } from 'effector';
import { PGlite, PGliteOptions, QueryOptions, Results } from '@electric-sql/pglite';

export type EventsMap = {
	command: { command: string };
};

export class ExtendedPGLite extends PGlite {
	private readonly events: {
		[K in keyof EventsMap]: EventCallable<EventsMap[K]>;
	} = {
		command: createEvent(),
	};

	constructor(options?: PGliteOptions) {
		super(options);
	}

	async query<T>(
		query: string,
		params?: any[] | undefined,
		options?: QueryOptions | undefined,
	): Promise<Results<T>> {
		const result = await super.query<T>(query, params, options);
		this.events.command({ command: query });

		return result;
	}

	async exec(
		query: string,
		options?: QueryOptions | undefined,
	): Promise<Results<{ [key: string]: any }>[]> {
		const result = await super.exec(query, options);
		this.events.command({ command: query });

		return result;
	}

	public on<T extends keyof EventsMap>(
		eventName: T,
		callback: (payload: EventsMap[T]) => void,
		{ once = false }: { once?: boolean } = {},
	) {
		const cleanup = this.events[eventName].watch((data) => {
			if (once) {
				cleanup.unsubscribe();
			}

			callback(data);
		});

		return cleanup;
	}
}
