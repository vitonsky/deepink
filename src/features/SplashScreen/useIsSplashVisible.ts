import { useLayoutEffect, useState } from 'react';

/**
 * Returns true immediately, but delays returning false by the specified delay.
 */
export const useIsSplashVisible = (isVisible: boolean, delay = 500) => {
	const [isSplashVisible, setIsSplashVisible] = useState(isVisible);

	useLayoutEffect(() => {
		if (isVisible) {
			setIsSplashVisible(true);
			return;
		}

		const timer = setTimeout(() => setIsSplashVisible(false), delay);
		return () => clearTimeout(timer);
	}, [delay, isVisible]);

	return isSplashVisible;
};
