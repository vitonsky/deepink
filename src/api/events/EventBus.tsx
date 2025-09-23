import { NoteId } from '@core/features/notes';

/**
 * Events payload map
 */
export type EventsPayloadMap = {
	/**
	 * Fired when specific note  has been updated
	 */
	noteUpdated: NoteId;

	/**
	 * Fired when history of specific note has been updated
	 */
	noteHistoryUpdated: NoteId;
};

/**
 * Interface for a global events exchange in app
 */
export type EventBus = {
	/**
	 * Fire event by its name and provide payload if needed
	 */
	emit: <K extends keyof EventsPayloadMap>(
		eventName: K,
		...args: EventsPayloadMap[K] extends void
			? [payload?: void]
			: [payload: EventsPayloadMap[K]]
	) => void;

	/**
	 * Add listener for a specific event
	 */
	listen: <T extends keyof EventsPayloadMap>(
		eventName: T,
		callback: (payload: EventsPayloadMap[T]) => void,
	) => () => void;
};
