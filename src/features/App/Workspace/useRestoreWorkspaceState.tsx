import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	useWorkspaceActions,
	useWorkspaceData,
	useWorkspaceSelector,
} from '@state/redux/profiles/hooks';
import { selectIsWorkspaceReady } from '@state/redux/profiles/profiles';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingStatus';

import { useProfileControls } from '../Profile';
import { useWorkspaceState } from './useWorkspaceState';
import { useNotesRegistry } from './WorkspaceProvider';

export const useRestoreWorkspaceState = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const controls = useProfileControls();
	const workspaceActions = useWorkspaceActions();
	const notesRegistry = useNotesRegistry();

	// Initialize workspace state
	const isWorkspaceReady = useAppSelector(selectIsWorkspaceReady(workspaceData));
	const getWorkspaceState = useWorkspaceState({
		sync: Boolean(isWorkspaceReady),
		controls,
		workspaceId: workspaceData.workspaceId,
	});

	const isTagsReady = useWorkspaceSelector(selectIsTagsReady);
	useEffect(() => {
		if (!isTagsReady) return;

		// Restore workspace state
		getWorkspaceState().then(async (state) => {
			if (state) {
				dispatch(
					workspaceActions.restoreFilters({
						search: state.search || null,
						view: state.view || null,
						selectedTag: state.selectedTagId || null,
					}),
				);

				// Restore opened notes
				if (state.openedNoteIds && state.openedNoteIds.length !== 0) {
					const notes = await notesRegistry.getById(state.openedNoteIds);
					if (notes && notes.length !== 0) {
						dispatch(
							workspaceActions.setOpenedNotes({
								notes,
							}),
						);

						const activeNote =
							(state.activeNoteId &&
								notes.find((n) => n.id === state.activeNoteId)) ||
							notes[0];
						dispatch(
							workspaceActions.setActiveNote({
								noteId: activeNote.id,
							}),
						);
					}
				}
			}

			// Finish restoring
			dispatch(
				workspaceActions.setWorkspaceLoadingStatus({
					status: {
						isDataReady: true,
						isFiltersReady: true,
					},
				}),
			);
		});
	}, [getWorkspaceState, dispatch, isTagsReady, workspaceActions, notesRegistry]);
};
