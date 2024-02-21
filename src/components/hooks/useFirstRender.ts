import { useEffect, useRef } from 'react';

export const useFirstRender = (callback: () => void | (() => void)) => {
	const isFirstRenderRef = useRef(true);

	// Run callback on first render
	const cleanupCallbackRef = useRef<null | (() => void)>(null);
	if (isFirstRenderRef.current) {
		const cleanupCallback = callback();

		if (cleanupCallback) {
			cleanupCallbackRef.current = cleanupCallback;
		}
	}

	// Prevent run callback in future
	isFirstRenderRef.current = false;

	// Run cleanup function on unmount
	useEffect(() => {
		return () => {
			if (cleanupCallbackRef.current) {
				cleanupCallbackRef.current();
			}
		};
	}, []);
};
