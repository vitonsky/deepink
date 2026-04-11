import { useRef } from 'react';

/**
 * Always returns the latest passed value unlike `useRef`
 */
export const useAsRef = <T>(value: T) => {
	const ref = useRef(value);
	ref.current = value;

	// Return readonly ref
	return ref as {
		/**
		 * The current value of the ref.
		 */
		readonly current: T;
	};
};
