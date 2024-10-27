import React, { FC } from 'react';
import { Text, useMultiStyleConfig, VStack } from '@chakra-ui/react';
import { getNoteTitle } from '@core/features/notes/utils';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectNotes } from '@state/redux/profiles/profiles';

import { useNoteActions } from '../../../hooks/notes/useNoteActions';
import { useUpdateNotes } from '../../../hooks/notes/useUpdateNotes';

import { useDefaultNoteContextMenu } from './NoteContextMenu/useDefaultNoteContextMenu';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const styles = useMultiStyleConfig('NotesList');

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
		<VStack sx={styles.root}>
			{notes.length === 0 ? (
				<Text pos="relative" top="40%">
					Nothing added yet
				</Text>
			) : (
				<VStack sx={styles.notes}>
					{notes.map((note) => {
						const date = note.createdTimestamp ?? note.updatedTimestamp;
						const text = note.content.text.slice(0, 80).trim();

						return (
							<VStack
								key={note.id}
								w="100%"
								align="start"
								gap="0.6rem"
								sx={styles.note}
								aria-selected={note.id === activeNoteId}
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
								<VStack sx={styles.body}>
									<Text as="h3" sx={styles.title}>
										{getNoteTitle(note.content)}
									</Text>

									{text.length > 0 && (
										<Text sx={styles.text}>{text}</Text>
									)}
								</VStack>

								{date && (
									<Text sx={styles.meta}>
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
