/**
 * Interface for a global events exchange in app
 */
export type EventBus<PayloadMap extends Record<string, unknown>> = {
	/**
	 * Fire event by its name and provide payload if needed
	 */
	emit: <K extends keyof PayloadMap>(
		eventName: K,
		...args: PayloadMap[K] extends void ? [payload?: void] : [payload: PayloadMap[K]]
	) => void;

	/**
	 * Add listener for a specific event
	 */
	listen: <T extends keyof PayloadMap>(
		eventName: T,
		callback: (payload: PayloadMap[T]) => void,
	) => () => void;
};
