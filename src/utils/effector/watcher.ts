import { Store } from 'effector';

export type CleanupFn = () => void;
export type CallbackWithCleanup<T extends unknown[]> = (
	...args: T
) => void | (() => void);

/**
 * Creates updatable function, that call a callback by call itself.
 * Callback may return a cleanup function, that will be called before next call and when wrapper will be disposed.
 */
export const createCleanable = <T extends unknown[]>(
	callback: CallbackWithCleanup<T>,
) => {
	let cleanupFn: null | (() => void) = null;

	const cleanup = () => {
		if (!cleanupFn) return;

		cleanupFn();
		cleanupFn = null;
	};

	const call = (...args: T) => {
		cleanup();
		cleanupFn = callback(...args) ?? null;
	};

	return Object.assign(call, { cleanup });
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

	const subscribe = store.watch(wrappedCallback);

	return () => {
		subscribe.unsubscribe();
		wrappedCallback.cleanup();
	};
};
