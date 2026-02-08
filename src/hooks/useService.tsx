import { useCallback, useRef } from 'react';
import { createEvent } from 'effector';

const runService = (service: () => Promise<() => Promise<void>>) => {
	const onComplete = createEvent();

	let activeCleanup: Promise<void> | null = null;
	const wrappedCleanup = service().then((stop) => () => {
		if (!activeCleanup) {
			activeCleanup = stop().then(() => {
				onComplete();
			});
		}

		return activeCleanup;
	});

	return {
		onComplete,
		async getCleanup() {
			return wrappedCleanup;
		},
	};
};

/**
 * Provides a method to run a service.
 * One hook must run one service.
 *
 * When service is requested to run, the current active service will be waited to complete.
 * In case a service run requested many times while run another service - all intermediate runs will be skipped.
 */
export const useService = () => {
	const stateRef = useRef<{
		context: symbol;
		service: null | ReturnType<typeof runService>;
	}>({
		context: Symbol(),
		service: null,
	});

	return useCallback(
		(
			service: () => Promise<() => Promise<void>>,
			{
				onStarted,
				onCompleted,
			}: {
				onStarted?: () => void;
				onCompleted?: (reason: 'stopped' | 'cancelled') => void;
			} = {},
		) => {
			const instanceContext = Symbol();

			// Take context
			stateRef.current.context = instanceContext;
			async function startService() {
				// Wait a previous service will complete
				const anotherInstance = stateRef.current.service;
				if (anotherInstance)
					await new Promise((res) => anotherInstance.onComplete.watch(res));

				// Check if context has not been changed after wait
				// Changed context means that another instance have been started
				// In that case we should exit and let another instance to run
				if (stateRef.current.context !== instanceContext) {
					return null;
				}

				const serviceControl = runService(service);
				serviceControl.onComplete.watch(() => {
					// Reset service
					if (stateRef.current.service === serviceControl) {
						stateRef.current.service = null;
					}
				});

				stateRef.current.service = serviceControl;

				return serviceControl;
			}

			const serviceControls = startService();
			serviceControls.then((controls) => {
				if (controls === null) {
					onCompleted?.('cancelled');
				} else {
					onStarted?.();
				}
			});

			return () => {
				serviceControls.then(async (controls) => {
					if (controls === null) return;

					const stop = await controls.getCleanup();
					await stop();
					onCompleted?.('stopped');
				});
			};
		},
		[],
	);
};
