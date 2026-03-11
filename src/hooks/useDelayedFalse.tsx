import { useLayoutEffect, useState } from 'react';

/**
 * Returns true immediately, but delays returning false by the specified delay.
 */
export const useDelayedFalse = (value: boolean, delay = 500) => {
	const [delayedValue, setDelayedValue] = useState(value);

	useLayoutEffect(() => {
		if (value) {
			setDelayedValue(true);
			return;
		}

		const timer = setTimeout(() => setDelayedValue(false), delay);
		return () => clearTimeout(timer);
	}, [delay, value]);

	return delayedValue;
};
