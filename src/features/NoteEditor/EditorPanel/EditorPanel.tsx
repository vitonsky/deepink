import React from 'react';
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
import { Button, HStack } from '@chakra-ui/react';

import { useEditorPanelContext } from '.';

// TODO: implement logic for all buttons
// TODO: make heading button are menu with options to pick level
// TODO: add titles for buttons
// TODO: implement notifications from editor to panel, to render current state for formatting buttons
export const EditorPanel = () => {
	const { onInserting } = useEditorPanelContext();

	return (
		<HStack
			gap="1rem"
			onMouseDown={(evt) => {
				evt.preventDefault();
				evt.stopPropagation();
			}}
		>
			<Button size="sm" variant="ghost">
				<FaHeading />
			</Button>
			<HStack gap="0">
				<Button size="sm" variant="ghost">
					<FaBold />
				</Button>
				<Button size="sm" variant="ghost">
					<FaItalic />
				</Button>
				<Button size="sm" variant="ghost">
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
				<Button size="sm" variant="ghost">
					<FaLink />
				</Button>
				<Button size="sm" variant="ghost">
					<FaImage />
				</Button>
				<Button size="sm" variant="ghost">
					<FaCode />
				</Button>
				<Button size="sm" variant="ghost">
					<FaQuoteLeft />
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
				<Button size="sm" variant="ghost">
					<FaCalendarDay />
				</Button>
			</HStack>
		</HStack>
	);
};
