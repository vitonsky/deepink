import { useEffect, useRef, useState } from 'react';

/**
 * Guarantees a minimum visible duration for any loading state
 */
export const useShowForMinimumTime = (isLoading: boolean, minTime = 500) => {
	const loadingStartRef = useRef<number | null>(null);
	const [isShow, setIsShow] = useState<boolean>(false);

	useEffect(() => {
		if (isLoading) {
			loadingStartRef.current = Date.now();
			setIsShow(true);
			return;
		}

		if (loadingStartRef.current === null) return;

		const delta = Date.now() - loadingStartRef.current;
		const delay = Math.max(0, minTime - delta);

		const timer = setTimeout(() => {
			setIsShow(false);
			loadingStartRef.current = null;
		}, delay);

		return () => clearTimeout(timer);
	}, [isLoading, minTime]);

	return isShow;
};
