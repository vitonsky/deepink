import { useEffect, useRef } from 'react';

/**
 * Return ref and focus on element once
 */
export const useFocusableRef = <T extends HTMLElement>() => {
	const elementRef = useRef<null | T>(null);
	useEffect(() => {
		elementRef.current?.focus();
	}, []);

	return elementRef;
};
