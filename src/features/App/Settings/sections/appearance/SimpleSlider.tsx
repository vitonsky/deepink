import React from 'react';
import {
	Slider,
	SliderFilledTrack,
	SliderMark,
	SliderProps,
	SliderThumb,
	SliderTrack,
	Tooltip,
} from '@chakra-ui/react';

// TODO: use accent color
/**
 * Simple to use slider control
 * Under the hood is a https://v2.chakra-ui.com/docs/components/slider with sensible defaults
 */

export const SimpleSlider = (
	props: Omit<SliderProps, 'defaultValue'> &
		Required<Pick<SliderProps, 'value' | 'min' | 'max'>>,
) => {
	const { value, min, max } = props;
	return (
		<Slider {...props}>
			<SliderMark value={min} mt="1" fontSize="sm" color="typography.secondary">
				{min}
			</SliderMark>
			<SliderMark
				value={max}
				mt="1"
				fontSize="sm"
				color="typography.secondary"
				transform="translateX(-100%)"
			>
				{max}
			</SliderMark>
			<SliderTrack>
				<SliderFilledTrack />
			</SliderTrack>
			<Tooltip hasArrow placement="top" label={value}>
				<SliderThumb />
			</Tooltip>
		</Slider>
	);
};
