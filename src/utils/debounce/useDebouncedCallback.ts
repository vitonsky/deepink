import { useRef } from 'react';
import { isEqual } from 'lodash';
import { useImmutableCallback } from '@hooks/useImmutableCallback';

import { debounce, DebouncedFn, DebounceOptions } from './debounce';

// We introduce ourself implementation since of bug https://github.com/xnimorz/use-debounce/issues/202
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
	callback: T,
	options: DebounceOptions,
) => {
	const immutableCallback = useImmutableCallback(callback, [callback]);

	const stateRef = useRef<null | {
		fn: DebouncedFn<T>;
		options: DebounceOptions;
	}>(null);

	if (stateRef.current === null) {
		stateRef.current = {
			fn: debounce(immutableCallback, options),
			options,
		};
	} else if (!isEqual(stateRef.current.options, options)) {
		stateRef.current.fn.cancel();

		stateRef.current = {
			fn: debounce(immutableCallback, options),
			options,
		};
	}

	return stateRef.current.fn;
};
