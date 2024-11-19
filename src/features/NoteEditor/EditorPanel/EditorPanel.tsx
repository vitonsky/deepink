import React from 'react';
import {
	FaBold,
	FaCalendarDay,
	FaCode,
	FaItalic,
	FaListCheck,
	FaListOl,
	FaListUl,
	FaMinus,
	FaPaperclip,
	FaQuoteLeft,
	FaStrikethrough,
} from 'react-icons/fa6';
import { Button, HStack } from '@chakra-ui/react';

import { HeaderPicker } from './buttons/HeaderPicker';
import { ImageButton } from './buttons/ImageButton';
import { LinkButton } from './buttons/LinkButton';
import { useEditorPanelContext } from '.';

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
				<LinkButton
					onPick={(payload) =>
						onInserting({
							type: 'link',
							data: payload,
						})
					}
				/>
				<ImageButton
					onPick={(payload) =>
						onInserting({
							type: 'image',
							data: payload,
						})
					}
				/>
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
