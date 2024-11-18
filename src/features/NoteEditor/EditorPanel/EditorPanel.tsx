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
			<Button
				size="sm"
				variant="ghost"
				onClick={() => {
					onInserting({ type: 'heading', data: { level: 1 } });
				}}
			>
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
						onInserting({ type: 'horizontalRule' });
					}}
				>
					<FaMinus />
				</Button>
				<Button size="sm" variant="ghost">
					<FaPaperclip />
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
			</HStack>
		</HStack>
	);
};
