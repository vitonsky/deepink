import { createEvent, EventCallable } from 'effector';
import { PGlite, PGliteOptions } from '@electric-sql/pglite';

export type EventsMap = {
	sync: void;
};

export class ExtendedPGLite extends PGlite {
	private readonly events: {
		[K in keyof EventsMap]: EventCallable<EventsMap[K]>;
	} = {
		sync: createEvent(),
	};

	constructor(options?: PGliteOptions) {
		super(options);
	}

	syncToFs(): Promise<void> {
		this.events.sync();
		return super.syncToFs();
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
