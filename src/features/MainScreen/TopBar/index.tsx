import React, { FC, useEffect, useMemo, useRef } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { Box, HStack, Tab, TabList, Tabs, Text } from '@chakra-ui/react';
import { INote, NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { getNoteTitle } from '@core/features/notes/utils';

import { useDefaultNoteContextMenu } from '../NotesList/NoteContextMenu/useDefaultNoteContextMenu';

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

	const activeTabRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		activeTabRef.current?.scrollIntoView();
	}, [tabIndex]);

	return (
		<Tabs
			index={tabIndex}
			onChange={(index) => {
				onPick(existsTabs[index]);
			}}
			w="100%"
			maxH="100px"
			overflow="auto"
			bgColor="surface.panel"
		>
			<TabList
				flexWrap="wrap"
				borderBottom="1px solid"
				borderColor="surface.border"
				display="grid"
				gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))"
			>
				{existsTabs.map((noteId, index) => {
					const isActiveTab = index === tabIndex;

					// TODO: handle case when object not found
					const note = notes.find((note) => note.id === noteId);
					if (!note) {
						throw new Error('Note not found');
					}

					const title = getNoteTitle(note.content);

					return (
						<Tab
							key={note.id}
							ref={isActiveTab ? activeTabRef : undefined}
							padding="0.4rem 0.7rem"
							border="none"
							fontWeight="600"
							fontSize="14"
							maxW="250px"
							marginBottom={0}
							title={title}
							onMouseDown={(evt) => {
								const isLeftButton = evt.button === 0;
								if (isLeftButton) return;

								evt.preventDefault();
								evt.stopPropagation();
							}}
							onMouseUp={(evt) => {
								const isMiddleButton = evt.button === 1;
								if (!isMiddleButton) return;

								onClose(note.id);
							}}
						>
							<HStack gap=".5rem" w="100%" justifyContent="space-between">
								<Text
									maxW="180px"
									whiteSpace="nowrap"
									overflow="hidden"
									textOverflow="ellipsis"
									onContextMenu={(evt) => {
										openNoteContextMenu(note.id, {
											x: evt.pageX,
											y: evt.pageY,
										});
									}}
								>
									{title}
								</Text>
								<Box
									title="Close tab"
									sx={{
										'&:not(:hover)': {
											opacity: '0.7',
										},
									}}
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
