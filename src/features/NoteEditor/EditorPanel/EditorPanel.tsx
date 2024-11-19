import React, { useCallback, useEffect, useState } from 'react';
import {
	FaBold,
	FaCalendarDay,
	FaCode,
	FaHeading,
	FaImage,
	FaItalic,
	FaLink,
	FaListCheck,
	FaListOl,
	FaListUl,
	FaMinus,
	FaPaperclip,
	FaQuoteLeft,
	FaStrikethrough,
} from 'react-icons/fa6';
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

import { HeaderLevel, useEditorPanelContext } from '.';

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

// TODO: implement logic for all buttons
// TODO: make heading button are menu with options to pick level
// TODO: add titles for buttons
// TODO: implement notifications from editor to panel, to render current state for formatting buttons
export const EditorPanel = () => {
	const { onInserting, onFormatting } = useEditorPanelContext();

	return (
		<HStack
			gap="1rem"
			padding="4px"
			overflow="hidden"
			onMouseDown={(evt) => {
				evt.preventDefault();
				evt.stopPropagation();
			}}
		>
			<HeaderPicker
				onPick={(level) => {
					onInserting({ type: 'heading', data: { level } });
				}}
			/>

			<HStack gap="0">
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onFormatting('bold');
					}}
				>
					<FaBold />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onFormatting('italic');
					}}
				>
					<FaItalic />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onFormatting('strikethrough');
					}}
				>
					<FaStrikethrough />
				</Button>
			</HStack>

			<HStack gap="0">
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({ type: 'list', data: { type: 'unordered' } });
					}}
				>
					<FaListUl />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({ type: 'list', data: { type: 'checkbox' } });
					}}
				>
					<FaListCheck />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({ type: 'list', data: { type: 'ordered' } });
					}}
				>
					<FaListOl />
				</Button>
			</HStack>

			<HStack gap="0">
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({
							type: 'link',
							data: { url: 'https://example.org', text: 'test link' },
						});
					}}
				>
					<FaLink />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({
							type: 'image',
							data: {
								url: 'https://artprojectsforkids.org/wp-content/uploads/2024/04/How-to-Draw-a-Cow-web.jpg',
								altText: 'alt text',
							},
						});
					}}
				>
					<FaImage />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({ type: 'code', data: {} });
					}}
				>
					<FaCode />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({ type: 'quote', data: {} });
					}}
				>
					<FaQuoteLeft />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({
							type: 'date',
							data: { date: new Date().toDateString() },
						});
					}}
				>
					<FaCalendarDay />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						onInserting({ type: 'horizontalRule' });
					}}
				>
					<FaMinus />
				</Button>
				<Button size="sm" variant="ghost">
					<FaPaperclip />
				</Button>
			</HStack>
		</HStack>
	);
};
