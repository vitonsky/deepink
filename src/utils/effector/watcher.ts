import { Store } from 'effector';

export type CleanupFn = () => void;
export type CallbackWithCleanup<T extends unknown[]> = (...args: T) => CleanupFn | void;

/**
 * Wrap callback into object and run it by call a method `call`.
 * Callback may return a cleanup function, that will be executed before next run a callback or by call a method `call`.
 */
export const createCleanable = <T extends unknown[]>(
	callback: CallbackWithCleanup<T>,
) => {
	let cleanupFn: CleanupFn | null = null;

	const cleanup = () => {
		if (!cleanupFn) return;

		cleanupFn();
		cleanupFn = null;
	};

	const call = (...args: T) => {
		cleanup();
		cleanupFn = callback(...args) ?? null;
	};

	return { call, cleanup } as const;
};

/**
 * Creates store watcher, that call a callback by update a store.
 * Callback may return a cleanup function, that will be called before next call and when watcher will be stopped.
 */
export const createWatcher = <T extends unknown>(
	store: Store<T>,
	callback: CallbackWithCleanup<[T]>,
) => {
	const wrappedCallback = createCleanable(callback);

	const subscribe = store.watch(wrappedCallback.call);

	return () => {
		subscribe.unsubscribe();
		wrappedCallback.cleanup();
	};
};
