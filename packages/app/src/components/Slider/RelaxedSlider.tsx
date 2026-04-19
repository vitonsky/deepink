import React from 'react';
import { useRelaxedValue } from '@hooks/useRelaxedValue';

import { SimpleSlider, SimpleSliderProps } from './SimpleSlider';

/**
 * Slider with debounced value
 * @returns
 */
export const RelaxedSlider = ({
	value,
	onChange,
	wait,
	...props
}: SimpleSliderProps & { wait?: number }) => {
	const [state, setState] = useRelaxedValue({
		value,
		onChange(value) {
			onChange?.(value);
		},
		wait,
	});

	return <SimpleSlider {...props} value={state} onChange={setState} />;
};
