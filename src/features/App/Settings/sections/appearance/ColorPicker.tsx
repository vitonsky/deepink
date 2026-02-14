import React, { useMemo } from 'react';
import { Box, HStack } from '@chakra-ui/react';
import { accentColorsMap } from '@features/accentColorsMap';
import { useRelaxedValue } from '@hooks/useRelaxedValue';

export const ColorPicker = ({
	isDisabled,
	...props
}: {
	color?: string;
	onChange?: (color: string) => void;
	isDisabled?: boolean;
}) => {
	const [color, setColor] = useRelaxedValue({
		value: props.color,
		onChange(value) {
			if (!value) return;
			props.onChange?.(value);
		},
	});
	const colors = useMemo(
		() => [
			{
				id: 'auto',
				sample: 'conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #5ac8fa, #007aff, #5856d6, #af52de, #ff3b30)',
			},
			...Object.entries(accentColorsMap).map(([id, sample]) => ({ id, sample })),
		],
		[],
	);

	return (
		<HStack opacity={isDisabled ? '.5' : undefined}>
			{colors.map(({ id, sample }) => {
				const isActive = id === color;
				return (
					<Box
						key={id}
						boxSize="1.3rem"
						background={sample}
						borderRadius="100%"
						outlineOffset={1}
						outline={isActive ? '3px solid' : undefined}
						outlineColor={
							isActive ? 'control.action.active.background' : 'transparent'
						}
						onClick={() => {
							if (isDisabled) return;

							setColor(id);
						}}
					/>
				);
			})}
		</HStack>
	);
};
