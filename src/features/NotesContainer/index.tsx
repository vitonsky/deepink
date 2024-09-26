import React, { FC, useCallback } from 'react';
import { IStackProps, Stack } from '@components/Stack/Stack';
import { INote } from '@core/features/notes';
import { cnMainScreen } from '@features/MainScreen';
import { Notes } from '@features/MainScreen/Notes';
import { TopBar } from '@features/MainScreen/TopBar';
import { useNotesContext, useNotesRegistry } from '@features/Workspace/WorkspaceProvider';
import { useWorkspaceSelector } from '@state/redux/workspaces/hooks';
import {
	createWorkspaceSelector,
	selectActiveNoteId,
	selectOpenedNotes,
} from '@state/redux/workspaces/workspaces';

import { useNoteActions } from '../../hooks/notes/useNoteActions';
import { useUpdateNotes } from '../../hooks/notes/useUpdateNotes';

export type NotesContainerProps = Partial<IStackProps>;

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
