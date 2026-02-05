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

export const SimpleSlider = ({
	transformValue,
	...props
}: Omit<SliderProps, 'defaultValue'> &
	Required<Pick<SliderProps, 'value' | 'min' | 'max'>> & {
		transformValue?: (value: number) => string;
	}) => {
	const { value, min, max } = props;
	return (
		<Slider {...props}>
			<SliderMark value={min} mt="1" fontSize="sm" color="typography.secondary">
				{transformValue ? transformValue(min) : min}
			</SliderMark>
			<SliderMark
				value={max}
				mt="1"
				fontSize="sm"
				color="typography.secondary"
				transform="translateX(-100%)"
			>
				{transformValue ? transformValue(max) : max}
			</SliderMark>
			<SliderTrack>
				<SliderFilledTrack />
			</SliderTrack>
			<Tooltip
				hasArrow
				placement="top"
				label={transformValue ? transformValue(value) : value}
			>
				<SliderThumb />
			</Tooltip>
		</Slider>
	);
};
