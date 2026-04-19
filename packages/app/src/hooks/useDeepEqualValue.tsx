import { useRef } from 'react';
import { isEqual } from 'lodash';

/**
 * Returns the same value until its value is deeply equal to latest value
 */
export const useDeepEqualValue = <T extends unknown = void>(callback: () => T) => {
	const stateRef = useRef<{ value: T } | null>(null);

	const value = callback();
	if (stateRef.current === null || !isEqual(stateRef.current.value, value)) {
		stateRef.current = { value };
	}

	return stateRef.current.value;
};
