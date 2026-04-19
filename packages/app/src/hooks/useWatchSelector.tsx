import { useCallback } from 'react';
import { useAppStore } from '@state/redux/hooks';
import { RootState } from '@state/redux/store';

/**
 * Call the callback when state changes and selector returns new value
 */
export const useWatchSelector = () => {
	const store = useAppStore();
	return useCallback(
		<T extends unknown>({
			selector,
			onChange,
			init = true,
		}: {
			selector: (state: RootState) => T;
			onChange: (state: T) => void;
			init?: boolean;
		}) => {
			let valueRef: { value: T } | null = null;
			const trigger = () => {
				const state = store.getState();
				const currentValue = selector(state);

				if (!valueRef || valueRef.value !== currentValue) {
					valueRef = { value: currentValue };
					onChange(currentValue);
				}
			};

			if (init) trigger();

			return store.subscribe(trigger);
		},
		[store],
	);
};
