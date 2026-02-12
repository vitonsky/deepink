import { useCallback, useEffect, useRef, useState } from 'react';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useDebouncedCallback } from '@utils/debounce/useDebouncedCallback';

/**
 * Debounce a value changes with all respect to a source value.
 *
 * When source value changes, hook will update inner state in effect,
 * so updated value will be used on next render.
 *
 * This hook is useful for cases with frequent value updates
 * that makes UI freeze due to frequent re-renders.
 */
export const useRelaxedValue = <T extends unknown>({
	value,
	onChange,
	wait = 150,
	deadline,
}: {
	value: T;
	onChange: (value: T) => void;
	wait?: number;
	deadline?: number;
}) => {
	const [state, setState] = useState<T>(value);

	const debouncedOnChange = useDebouncedCallback(
		useImmutableCallback(onChange, [onChange]),
		{
			wait,
			deadline,
		},
	);

	const isFirstRenderRef = useRef(true);
	useEffect(() => {
		// Skip first render
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		debouncedOnChange.cancel();
		setState(value);
	}, [debouncedOnChange, value]);

	const updateState = useCallback(
		(value: T) => {
			setState(value);
			debouncedOnChange(value);
		},
		[debouncedOnChange],
	);

	return [state, updateState] as const;
};
