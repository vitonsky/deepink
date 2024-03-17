import React, { FC, useCallback } from 'react';
import { useStoreMap } from 'effector-react';
import { IStackProps, Stack } from '@components/Stack/Stack';
import { INote } from '@core/features/notes';
import { cnMainScreen } from '@features/MainScreen';
import { Notes } from '@features/MainScreen/Notes';
import { TopBar } from '@features/MainScreen/TopBar';
import { useNotesContext, useNotesRegistry } from '@features/Workspace/WorkspaceProvider';

import { useNoteActions } from '../../hooks/notes/useNoteActions';
import { useUpdateNotes } from '../../hooks/notes/useUpdateNotes';

export type NotesContainerProps = Partial<IStackProps>;

export const NotesContainer: FC<NotesContainerProps> = ({ ...props }) => {
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const notesRegistry = useNotesRegistry();
	const activeNotesContext = useNotesContext();
	const { events: notesEvents } = activeNotesContext;

	const activeNoteId = useStoreMap(
		activeNotesContext.$notes,
		({ activeNote }) => activeNote,
	);

	const openedNotes = useStoreMap(
		activeNotesContext.$notes,
		({ openedNotes }) => openedNotes,
	);

	const tabs = useStoreMap(activeNotesContext.$notes, ({ openedNotes }) =>
		openedNotes.map((note) => note.id),
	);

	// Simulate note update
	const updateNote = useCallback(
		async (note: INote) => {
			notesEvents.noteUpdated(note);
			await notesRegistry.update(note.id, note.content);
			await updateNotes();
		},
		[notesEvents, notesRegistry, updateNotes],
	);

	return (
		<Stack
			{...props}
			direction="vertical"
			spacing={2}
			className={cnMainScreen('ContentBlock')}
		>
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
			<div className={cnMainScreen('NoteEditors')}>
				<Notes
					{...{
						notes: openedNotes,
						tabs,
						activeTab: activeNoteId ?? null,
						updateNote,
					}}
				/>
			</div>
		</Stack>
	);
};
