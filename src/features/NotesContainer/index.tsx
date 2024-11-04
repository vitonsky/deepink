import React, { FC, useCallback } from 'react';
import { Box, StackProps, VStack } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import {
	useNotesContext,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { Notes } from '@features/MainScreen/Notes';
import { TopBar } from '@features/MainScreen/TopBar';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectOpenedNotes } from '@state/redux/profiles/profiles';
import { createWorkspaceSelector } from '@state/redux/profiles/utils';

import { useNoteActions } from '../../hooks/notes/useNoteActions';
import { useUpdateNotes } from '../../hooks/notes/useUpdateNotes';

export type NotesContainerProps = Partial<StackProps>;

export const NotesContainer: FC<NotesContainerProps> = ({ ...props }) => {
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const notesRegistry = useNotesRegistry();
	const { noteUpdated } = useNotesContext();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	const tabs = useWorkspaceSelector((state) =>
		createWorkspaceSelector([selectOpenedNotes], (notes) =>
			notes.map((note) => note.id),
		)(state),
	);

	// Simulate note update
	const updateNote = useCallback(
		async (note: INote) => {
			noteUpdated(note);
			await notesRegistry.update(note.id, note.content);
			await updateNotes();
		},
		[noteUpdated, notesRegistry, updateNotes],
	);

	return (
		<VStack align="start" w="100%" h="100%" {...props} gap=".5rem">
			<TopBar
				{...{
					notesRegistry,
					updateNotes,
					notes: openedNotes,
					tabs,
					activeTab: activeNoteId ?? null,
					onClose: noteActions.close,
					onPick: noteActions.click,
				}}
			/>
			<Box
				display="flex"
				flexGrow="100"
				width="100%"
				overflow="auto"
				padding="0 .5rem"
			>
				<Notes
					{...{
						notes: openedNotes,
						tabs,
						activeTab: activeNoteId ?? null,
						updateNote,
					}}
				/>
			</Box>
		</VStack>
	);
};
