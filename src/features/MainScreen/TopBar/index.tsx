import React, { FC, useMemo } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';
import { Box, HStack, Tab, TabList, Tabs, Text } from '@chakra-ui/react';
import { INote, NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { getNoteTitle } from '@core/features/notes/utils';

import { useDefaultNoteContextMenu } from '../NotesList/NoteContextMenu/useDefaultNoteContextMenu';

import './TopBar.css';

export const cnTopBar = cn('TopBar');

export type TopBarProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;
	onPick: (id: NoteId) => void;
	onClose: (id: NoteId) => void;

	notes: INote[];

	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesController;
};

// TODO: improve tabs style
export const TopBar: FC<TopBarProps> = ({
	notes,
	tabs,
	activeTab,
	onClose,
	onPick,
	updateNotes,
	notesRegistry,
}) => {
	const openNoteContextMenu = useDefaultNoteContextMenu({
		closeNote: onClose,
		notesRegistry,
		updateNotes,
	});

	const existsTabs = useMemo(
		() => tabs.filter((noteId) => notes.some((note) => note.id === noteId)),
		[tabs, notes],
	);

	const tabIndex = useMemo(() => {
		const tabId = existsTabs.findIndex((tabId) => tabId === activeTab);
		return tabId >= 0 ? tabId : 0;
	}, [activeTab, existsTabs]);

	return (
		<Tabs
			index={tabIndex}
			onChange={(index) => {
				onPick(existsTabs[index]);
			}}
			w="100%"
			bgColor="surface"
		>
			<TabList flexWrap="wrap" borderBottom="1px solid #e2e8f0">
				{existsTabs.map((noteId) => {
					// TODO: handle case when object not found
					const note = notes.find((note) => note.id === noteId);
					if (!note) {
						throw new Error('Note not found');
					}

					return (
						<Tab
							key={note.id}
							padding="0.4rem 0.6rem"
							border="none"
							color="#000"
							marginBottom={0}
							sx={{
								'&:hover': {
									backgroundColor: '#f1f1f1',
								},
							}}
							_selected={{
								backgroundColor: '#e8e6ff',
								color: '#6b00cb',
								'&:hover': {
									backgroundColor: '#e8e6ff',
								},
							}}
						>
							<HStack gap=".3rem">
								<Text
									onContextMenu={(evt) => {
										openNoteContextMenu(note.id, {
											x: evt.pageX,
											y: evt.pageY,
										});
									}}
								>
									{getNoteTitle(note.content)}
								</Text>
								<Box
									className={cnTopBar('CloseButton')}
									onClick={(evt) => {
										evt.stopPropagation();
										onClose(noteId);
									}}
								>
									<FaXmark />
								</Box>
							</HStack>
						</Tab>
					);
				})}
			</TabList>
		</Tabs>
	);
};
