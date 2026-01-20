import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { WorkspaceEvents } from '@api/events/workspace';
import { INote, NoteId } from '@core/features/notes';
import {
	useEventBus,
	useNotesContext,
	useNotesHistory,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useVaultSelector, useWorkspaceData } from '@state/redux/profiles/hooks';
import {
	selectIsNoteOpened,
	selectWorkspace,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { selectSnapshotSettings } from '@state/redux/profiles/selectors/vault';
import { RootState } from '@state/redux/store';

export const useNoteActions = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const { openNote: open, noteClosed } = useNotesContext();

	const store = useStore<RootState>();

	const notesRegistry = useNotesRegistry();

	const click = useCallback(
		(id: NoteId) => {
			const workspace = selectWorkspace(workspaceData)(store.getState());
			const isNoteOpened = selectIsNoteOpened(id)(workspace);

			if (isNoteOpened) {
				dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: id }));
			} else {
				notesRegistry.getById(id).then((note) => {
					if (note) open(note);
				});
			}
		},
		[dispatch, notesRegistry, open, store, workspaceData],
	);

	const openNote = useCallback(
		(note: INote) => {
			const workspace = selectWorkspace(workspaceData)(store.getState());
			const isNoteOpened = selectIsNoteOpened(note.id)(workspace);

			if (isNoteOpened) {
				dispatch(
					workspacesApi.setActiveNote({ ...workspaceData, noteId: note.id }),
				);
			} else {
				open(note);
			}
		},
		[dispatch, open, store, workspaceData],
	);

	const eventBus = useEventBus();
	const noteHistory = useNotesHistory();
	const { enabled: isSnapshotsEnabled } = useVaultSelector(selectSnapshotSettings);
	const close = useCallback(
		async (id: NoteId) => {
			noteClosed(id);

			if (!isSnapshotsEnabled) return;

			// Take note content snapshot (if not disabled)
			const note = await notesRegistry.getById(id);
			if (note && !note.isSnapshotsDisabled) {
				noteHistory.snapshot(id).then(() => {
					eventBus.emit(WorkspaceEvents.NOTE_HISTORY_UPDATED, id);
				});
			}
		},
		[eventBus, isSnapshotsEnabled, noteClosed, noteHistory, notesRegistry],
	);

	return { click, close, openNote };
};
