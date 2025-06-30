import { useCallback } from 'react';
import { NoteId } from '@core/features/notes';
import { useNotesContext } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectNotes,
	selectOpenedNotes,
	workspacesApi,
} from '@state/redux/profiles/profiles';

export const useNoteActions = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const { openNote, noteClosed } = useNotesContext();

	const openedNotes = useWorkspaceSelector(selectOpenedNotes);
	const notes = useWorkspaceSelector(selectNotes);

	// TODO: focus on note input
	const click = useCallback(
		(id: NoteId) => {
			const isNoteOpened = openedNotes.some((note) => note.id === id);
			if (isNoteOpened) {
				dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: id }));
			} else {
				const note = notes.find((note) => note.id === id);
				if (note) {
					openNote(note);
				}
			}
		},
		[dispatch, notes, openNote, openedNotes, workspaceData],
	);

	const close = useCallback(
		(id: NoteId) => {
			noteClosed(id);
		},
		[noteClosed],
	);

	return { click, close };
};
