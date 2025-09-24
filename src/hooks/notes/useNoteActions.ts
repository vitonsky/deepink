import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { WorkspaceEvents } from '@api/events/workspace';
import { NoteId } from '@core/features/notes';
import {
	useEventBus,
	useNotesContext,
	useNotesHistory,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
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

	const eventBus = useEventBus();
	const noteHistory = useNotesHistory();
	const notesRegistry = useNotesRegistry();
	const close = useCallback(
		async (id: NoteId) => {
			noteClosed(id);

			// Take note content snapshot (if not disabled)
			const note = await notesRegistry.getById(id);
			if (note && !note.isSnapshotsDisabled) {
				noteHistory.snapshot(id).then(() => {
					eventBus.emit(WorkspaceEvents.NOTE_HISTORY_UPDATED, id);
				});
			}
		},
		[eventBus, noteClosed, noteHistory, notesRegistry],
	);

	return { click, close };
};
