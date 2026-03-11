import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	useWorkspaceActions,
	useWorkspaceData,
	useWorkspaceSelector,
} from '@state/redux/profiles/hooks';
import { selectIsWorkspaceLoaded } from '@state/redux/profiles/profiles';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingStatus';

import { useWorkspaceState } from './useWorkspaceState';
import { useNotesRegistry } from './WorkspaceProvider';

export const useRestoreWorkspaceState = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();
	const notesRegistry = useNotesRegistry();

	const isTagsReady = useWorkspaceSelector(selectIsTagsReady);

	const isWorkspaceLoaded = useAppSelector(selectIsWorkspaceLoaded(workspaceData));
	const getWorkspaceState = useWorkspaceState({
		sync: Boolean(isWorkspaceLoaded),
		profileId: workspaceData.profileId,
		workspaceId: workspaceData.workspaceId,
	});

	const restoreOpenedNotes = useCallback(
		async ({
			openedNoteIds,
			activeNoteId,
		}: {
			openedNoteIds?: string[] | null;
			activeNoteId?: string | null;
		}) => {
			if (!openedNoteIds || openedNoteIds.length === 0) return;

			const notes = await notesRegistry.getById(openedNoteIds);
			if (!notes || notes.length === 0) return;

			dispatch(workspaceActions.setOpenedNotes({ notes }));

			const activeNote =
				(activeNoteId && notes.find((n) => n.id === activeNoteId)) || notes[0];
			dispatch(workspaceActions.setActiveNote({ noteId: activeNote.id }));
		},
		[dispatch, workspaceActions, notesRegistry],
	);

	// Initialize workspace state
	useEffect(() => {
		if (!isTagsReady) return;

		getWorkspaceState().then(async (state) => {
			// Restore workspace state if it exists
			if (state) {
				dispatch(
					workspaceActions.restoreFilters({
						search: state.search || null,
						view: state.view || null,
						selectedTagId: state.selectedTagId || null,
					}),
				);

				await restoreOpenedNotes({
					openedNoteIds: state.openedNoteIds,
					activeNoteId: state.activeNoteId,
				});
			}

			dispatch(
				workspaceActions.setWorkspaceLoadingStatus({
					status: {
						isOpenedNotesLoaded: true,
						isFiltersLoaded: true,
					},
				}),
			);
		});
	}, [getWorkspaceState, isTagsReady, restoreOpenedNotes, dispatch, workspaceActions]);
};
