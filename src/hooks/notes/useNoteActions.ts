import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { NoteId } from '@core/features/notes';
import { useNotesContext } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import {
	selectIsNoteOpened,
	selectNotes,
	selectWorkspace,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { RootState } from '@state/redux/store';

export const useNoteActions = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const { openNote, noteClosed } = useNotesContext();

	const store = useStore<RootState>();

	const click = useCallback(
		(id: NoteId) => {
			const workspace = selectWorkspace(workspaceData)(store.getState());
			const notes = selectNotes(workspace);
			const isNoteOpened = selectIsNoteOpened(id)(workspace);

			console.log('DBG 1', {
				isNoteOpened,
				clickedNote: notes.find((note) => note.id === id),
			});

			if (isNoteOpened) {
				dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: id }));
			} else {
				const note = notes.find((note) => note.id === id);
				if (note) {
					openNote(note);
				}
			}
		},
		[dispatch, openNote, store, workspaceData],
	);

	const close = useCallback(
		(id: NoteId) => {
			noteClosed(id);
		},
		[noteClosed],
	);

	return { click, close };
};
