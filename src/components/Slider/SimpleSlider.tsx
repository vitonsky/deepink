import React, { useReducer } from 'react';
import {
	Slider,
	SliderFilledTrack,
	SliderMark,
	SliderProps,
	SliderThumb,
	SliderTrack,
	Tooltip,
} from '@chakra-ui/react';

export type SimpleSliderProps = Omit<SliderProps, 'defaultValue'> &
	Required<Pick<SliderProps, 'value' | 'min' | 'max'>> & {
		transformValue?: (value: number) => string;
	};

type SliderState = { hover: boolean; dragging: boolean };

/**
 * Simple to use slider control
 * Under the hood is a https://v2.chakra-ui.com/docs/components/slider with sensible defaults
 */

export const SimpleSlider = ({ transformValue, ...props }: SimpleSliderProps) => {
	const [state, updateState] = useReducer<SliderState, [Partial<SliderState>]>(
		(state, changes) => {
			return { ...state, ...changes };
		},
		{
			hover: false,
			dragging: false,
		},
	);

	const { value, min, max } = props;
	return (
		<Slider
			{...props}
			onMouseEnter={() => updateState({ hover: true })}
			onMouseLeave={() => updateState({ hover: false })}
			onChangeStart={() => {
				updateState({ dragging: true });
			}}
			onChangeEnd={() => {
				updateState({ dragging: false });
			}}
		>
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
				isOpen={state.dragging || state.hover}
			>
				<SliderThumb />
			</Tooltip>
		</Slider>
	);
};
