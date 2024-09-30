import React, { FC } from 'react';
import { Text, VStack } from '@chakra-ui/react';
import { getNoteTitle } from '@core/features/notes/utils';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectNotes } from '@state/redux/profiles/profiles';

import { useNoteActions } from '../../../hooks/notes/useNoteActions';
import { useUpdateNotes } from '../../../hooks/notes/useUpdateNotes';

import { useDefaultNoteContextMenu } from './NoteContextMenu/useDefaultNoteContextMenu';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const notesRegistry = useNotesRegistry();
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const notes = useWorkspaceSelector(selectNotes);

	const openNoteContextMenu = useDefaultNoteContextMenu({
		closeNote: noteActions.close,
		notesRegistry,
		updateNotes,
	});

	// TODO: get preview text from DB as prepared value
	// TODO: show attachments
	// TODO: implement dragging and moving items
	return (
		<VStack w="100%" h="100%" overflow="auto" align="center">
			{notes.length === 0 ? (
				<Text pos="relative" top="40%">
					Nothing added yet
				</Text>
			) : (
				<VStack w="100%" align="start" gap="4px">
					{notes.map((note) => {
						const date = note.createdTimestamp ?? note.updatedTimestamp;
						const text = note.content.text.slice(0, 80).trim();

						return (
							<VStack
								key={note.id}
								w="100%"
								align="start"
								gap="0.6rem"
								sx={{
									cursor: 'pointer',
									padding: '0.5rem',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									// borderRadius: '6px',

									...(note.id === activeNoteId
										? {
												backgroundColor: '#e8e6ff',
												color: '#6b00cb',
										  }
										: {
												'&:hover': {
													backgroundColor: '#f1f1f1',
												},
										  }),
								}}
								onContextMenu={(evt) => {
									openNoteContextMenu(note.id, {
										x: evt.pageX,
										y: evt.pageY,
									});
								}}
								onClick={() => {
									noteActions.click(note.id);
								}}
							>
								<VStack gap="0.2rem" align="start">
									<Text as="h3" fontWeight="bold" fontSize="18px">
										{getNoteTitle(note.content)}
									</Text>

									{text.length > 0 && (
										<Text fontSize="14px">{text}</Text>
									)}
								</VStack>

								{date && (
									<Text color="#000000bf" fontSize="14px">
										{new Date(date).toDateString()}
									</Text>
								)}
							</VStack>
						);
					})}
				</VStack>
			)}
		</VStack>
	);
};
