import React, { useCallback, useEffect, useState } from 'react';
import { FaHeading } from 'react-icons/fa6';
import {
	Button,
	HStack,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	MenuProps,
	Text,
} from '@chakra-ui/react';

import { HeaderLevel } from '..';

export const HeaderPicker = ({
	onPick,
	defaultLevel,
	...props
}: Omit<MenuProps, 'children'> & {
	onPick: (level: HeaderLevel) => void;
	defaultLevel?: HeaderLevel;
}) => {
	const [level, setLevel] = useState<HeaderLevel>(defaultLevel ?? 1);
	useEffect(() => {
		if (!defaultLevel) return;
		setLevel(defaultLevel);
	}, [defaultLevel]);

	const onPress = useCallback(
		(level: HeaderLevel) => {
			onPick(level);
			setLevel(level);
		},
		[onPick],
	);

	return (
		<Menu autoSelect={false} {...props}>
			<MenuButton
				as={Button}
				size="sm"
				variant="ghost"
				title={`Ctrl + click to insert header with level ${level}`}
				onClick={(evt) => {
					if (evt.ctrlKey) {
						evt.preventDefault();
						evt.stopPropagation();
						onPress(level);
					}
				}}
				minW="auto"
			>
				<FaHeading />
			</MenuButton>
			<MenuList minW="auto">
				{([1, 2, 3, 4, 5, 6] as const).map((level) => (
					<MenuItem
						paddingInlineEnd="1rem"
						onMouseDown={(evt) => {
							evt.preventDefault();
							evt.stopPropagation();
						}}
						onClick={() => {
							onPress(level);
						}}
					>
						<HStack>
							<FaHeading />
							<Text>Level {level}</Text>
						</HStack>
					</MenuItem>
				))}
			</MenuList>
		</Menu>
	);
};
