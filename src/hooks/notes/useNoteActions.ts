import { useCallback } from 'react';
import { NoteId } from '@core/features/notes';
import { useNotesContext } from '@features/Workspace/WorkspaceProvider';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectNotes, selectOpenedNotes, workspacesApi } from '@state/redux/workspaces';

export const useNoteActions = () => {
	const dispatch = useAppDispatch();

	const { openNote, noteClosed } = useNotesContext();

	const openedNotes = useAppSelector(selectOpenedNotes('default'));
	const notes = useAppSelector(selectNotes('default'));

	// TODO: focus on note input
	const click = useCallback(
		(id: NoteId) => {
			const isNoteOpened = openedNotes.some((note) => note.id === id);
			if (isNoteOpened) {
				dispatch(
					workspacesApi.setActiveNote({ workspace: 'default', noteId: id }),
				);
			} else {
				const note = notes.find((note) => note.id === id);
				if (note) {
					openNote(note);
				}
			}
		},
		[dispatch, notes, openNote, openedNotes],
	);

	const close = useCallback(
		(id: NoteId) => {
			noteClosed(id);
		},
		[noteClosed],
	);

	return { click, close };
};
