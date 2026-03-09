import { useCallback, useEffect } from 'react';
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
import {
	NOTES_VIEW,
	selectTags,
	WorkspaceConfigScheme,
} from '@state/redux/profiles/profiles';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingStatus';

import { useProfileControls } from '../Profile';
import { WorkspaceContainer } from './useWorkspace';
import { useWorkspaceState } from './useWorkspaceState';

type WorkspaceFilters = {
	search?: string | null;
	selectedTagId?: string | null;
	view?: NOTES_VIEW | null;
};

export const useRestoreWorkspaceConfig = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
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
};

export const useRestoreWorkspace = (workspace: WorkspaceContainer | null) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const controls = useProfileControls();
	const workspaceActions = useWorkspaceActions();

	useRestoreWorkspaceConfig();

	const restoreOpenedNotes = useCallback(
		async (openedNoteIds?: string[] | null, activeNoteId?: string | null) => {
			if (!workspace) return;
			if (!openedNoteIds || openedNoteIds.length === 0) return;

			const notes = await workspace.notesRegistry.getById(openedNoteIds);
			if (!notes || notes.length === 0) return;

			dispatch(
				workspaceActions.setOpenedNotes({
					notes,
				}),
			);

			const activeNote =
				(activeNoteId && notes.find((n) => n.id === activeNoteId)) || notes[0];
			dispatch(
				workspaceActions.setActiveNote({
					noteId: activeNote.id,
				}),
			);
		},
		[dispatch, workspaceActions, workspace],
	);

	const tags = useWorkspaceSelector(selectTags);
	const restoreFilters = useCallback(
		({ search, view, selectedTagId }: WorkspaceFilters) => {
			// Restore the selected tag if it exists
			if (tags.length !== 0 && selectedTagId) {
				const tag = tags.find((t) => t.id === selectedTagId);
				if (tag) {
					dispatch(
						workspaceActions.setSelectedTag({
							tag: tag.id,
						}),
					);
				}
			}

			if (view) {
				dispatch(
					workspaceActions.setView({
						view,
					}),
				);
			}

			dispatch(
				workspaceActions.setSearch({
					search: search ?? '',
				}),
			);
		},
		[dispatch, tags, workspaceActions],
	);

	// Initialize workspace state
	const getWorkspaceState = useWorkspaceState({
		sync: Boolean(workspace),
		controls,
		workspaceId: workspaceData.workspaceId,
	});

	const isTagsReady = useWorkspaceSelector(selectIsTagsReady);
	useEffect(() => {
		if (!isTagsReady) return;

		getWorkspaceState().then(async (state) => {
			if (state) {
				await restoreOpenedNotes(state.openedNoteIds, state.activeNoteId);
				restoreFilters({
					search: state.search,
					view: state.view,
					selectedTagId: state.selectedTagId,
				});
			}

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
		restoreFilters,
		isTagsReady,
		restoreOpenedNotes,
		workspaceActions,
	]);
};
