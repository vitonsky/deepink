import React, { useCallback, useEffect, useRef, useState } from 'react';
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

	const forceShowListRef = useRef(false);

	return (
		<Menu autoSelect={true} {...props}>
			<MenuButton
				as={Button}
				size="sm"
				variant="ghost"
				title={`Click to insert header with level ${level}. Open context menu to choose another option`}
				onMouseUp={(evt) => {
					const isAltButton = [1, 2].includes(evt.button);
					if (isAltButton) {
						forceShowListRef.current = true;
						(evt.target as HTMLElement).click();
					}
				}}
				onClick={(evt) => {
					// Let user pick options
					if (forceShowListRef.current) {
						forceShowListRef.current = false;
						return;
					}

					// Let user pick option by click with modifiers
					// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
					if (evt.ctrlKey || evt.metaKey) return;

					// Use default level
					evt.preventDefault();
					evt.stopPropagation();
					onPress(level);
				}}
				minW="auto"
			>
				<FaHeading />
			</MenuButton>
			<MenuList minW="auto">
				{([1, 2, 3, 4, 5, 6] as const).map((level) => (
					<MenuItem
						key={level}
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
