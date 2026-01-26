import { useEffect, useRef, useState } from 'react';

/**
 * Ensures a minimum visible time for loading states
 */
export const useShowForMinimumTime = ({
	isLoading,
	minTime = 500,
}: {
	isLoading: boolean;
	minTime?: number;
}) => {
	const startTimeRef = useRef<number | null>(null);
	const [isVisible, setIsVisible] = useState<boolean>(false);

	useEffect(() => {
		if (isLoading) {
			startTimeRef.current = Date.now();
			setIsVisible(true);
			return;
		}

		if (!startTimeRef.current) return;

		const delta = Date.now() - startTimeRef.current;
		const delay = Math.max(0, minTime - delta);

		const timer = setTimeout(() => {
			setIsVisible(false);
			startTimeRef.current = null;
		}, delay);

		return () => clearTimeout(timer);
	}, [isLoading, minTime]);

	return isVisible;
};
