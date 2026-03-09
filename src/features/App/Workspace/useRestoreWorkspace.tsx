import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useAppDispatch } from '@state/redux/hooks';
import {
	useWorkspaceActions,
	useWorkspaceData,
	useWorkspaceSelector,
} from '@state/redux/profiles/hooks';
import { WorkspaceConfigScheme } from '@state/redux/profiles/profiles';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingStatus';

import { useProfileControls } from '../Profile';
import { WorkspaceContainer } from './useWorkspace';
import { useWorkspaceState } from './useWorkspaceState';

export const useRestoreWorkspace = (workspace: WorkspaceContainer | null) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const controls = useProfileControls();
	const workspaceActions = useWorkspaceActions();

	// Load workspace configuration
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		const state = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

		state.get().then((workspaceConfig) => {
			if (workspaceConfig) {
				dispatch(
					workspaceActions.setWorkspaceNoteTemplateConfig({
						title: workspaceConfig.newNote.title,
						tags: workspaceConfig.newNote.tags,
					}),
				);
			}

			dispatch(
				workspaceActions.setWorkspaceLoadingStatus({
					status: {
						isConfigReady: true,
					},
				}),
			);
		});
	}, [dispatch, workspaceActions, workspaceFiles]);

	// Initialize workspace state
	const getWorkspaceState = useWorkspaceState({
		sync: Boolean(workspace),
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
					const notes = await workspace?.notesRegistry.getById(
						state.openedNoteIds,
					);
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
	}, [
		getWorkspaceState,
		dispatch,
		isTagsReady,
		workspaceActions,
		workspace?.notesRegistry,
	]);
};
