import React, { memo } from 'react';
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

export type EditorPanelProps = {
	readOnlyMode: boolean;
};

// TODO: add hotkeys to trigger panel commands
// TODO: implement notifications from editor to panel, to render current state for formatting buttons
export const EditorPanel = memo(({ readOnlyMode }: EditorPanelProps) => {
	const { onInserting, onFormatting } = useEditorPanelContext();

	return (
		!readOnlyMode && (
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
						title="Toggle bold text style"
						onClick={() => {
							onFormatting('bold');
						}}
					>
						<FaBold />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						title="Toggle italic text style"
						onClick={() => {
							onFormatting('italic');
						}}
					>
						<FaItalic />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						title="Toggle strikethrough text style"
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
						title="Insert or toggle unordered list"
						onClick={() => {
							onInserting({ type: 'list', data: { type: 'unordered' } });
						}}
					>
						<FaListUl />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						title="Insert or toggle checkbox list"
						onClick={() => {
							onInserting({ type: 'list', data: { type: 'checkbox' } });
						}}
					>
						<FaListCheck />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						title="Insert or toggle ordered list"
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
						title="Insert or wrap text with code block"
						onClick={() => {
							onInserting({ type: 'code' });
						}}
					>
						<FaCode />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						title="Insert or wrap text with quote block"
						onClick={() => {
							onInserting({ type: 'quote' });
						}}
					>
						<FaQuoteLeft />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						title="Insert date"
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
						title="Insert page break"
						onClick={() => {
							onInserting({ type: 'horizontalRule' });
						}}
					>
						<FaMinus />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						title="Insert file"
						onClick={() => {
							const input = document.createElement('input');
							input.type = 'file';
							input.multiple = true;
							input.addEventListener(
								'change',
								() => {
									const files = input.files;
									input.remove();

									if (files) {
										onInserting({
											type: 'file',
											data: {
												files,
											},
										});
									}
								},
								false,
							);

							input.click();
						}}
					>
						<FaPaperclip />
					</Button>
				</HStack>
			</HStack>
		)
	);
});

EditorPanel.displayName = 'EditorPanel';
