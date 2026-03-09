import { useCallback, useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	NOTES_VIEW,
	selectTags,
	WorkspaceConfigScheme,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingstatus';

import { useProfileControls } from '../Profile';
import { WorkspaceContainer } from './useWorkspace';
import { useWorkspaceState } from './useWorkspaceState';

type Filters = {
	search?: string | null;
	view?: NOTES_VIEW | null;
	selectedTagId?: string | null;
};

const useRestoreFilter = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const tags = useWorkspaceSelector(selectTags);

	return useCallback(
		async ({ search, view, selectedTagId }: Filters) => {
			// Restore selected tag only if it exists
			if (tags.length !== 0 && selectedTagId) {
				const tag = tags.find((t) => t.id === selectedTagId);
				if (tag) {
					dispatch(
						workspacesApi.setSelectedTag({
							...workspaceData,
							tag: tag.id,
						}),
					);
				}
			}

			dispatch(
				workspacesApi.setSearch({
					...workspaceData,
					search: search ?? '',
				}),
			);

			if (view) {
				dispatch(
					workspacesApi.setView({
						...workspaceData,
						view,
					}),
				);
			}

			dispatch(
				workspacesApi.setWorkspaceLoadingStatus({
					...workspaceData,
					changes: {
						isFiltersReady: true,
					},
				}),
			);
		},
		[dispatch, tags, workspaceData],
	);
};

export const useRestoreWorkspace = (workspace: WorkspaceContainer | null) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const controls = useProfileControls();

	// Load workspace config
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		const state = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

		state.get().then((workspaceConfig) => {
			if (workspaceConfig) {
				dispatch(
					workspacesApi.setWorkspaceNoteTemplateConfig({
						...workspaceData,
						title: workspaceConfig.newNote.title,
						tags: workspaceConfig.newNote.tags,
					}),
				);
			}

			dispatch(
				workspacesApi.setWorkspaceLoadingStatus({
					...workspaceData,
					changes: {
						isConfigReady: true,
					},
				}),
			);
		});
	}, [controls.profile.files, dispatch, workspaceData, workspaceFiles]);

	// Init workspace state
	const getWorkspaceState = useWorkspaceState({
		sync: Boolean(workspace),
		controls,
		workspaceId: workspaceData.workspaceId,
	});

	const restoreFilter = useRestoreFilter();
	const isTagsReady = useWorkspaceSelector(selectIsTagsReady);
	useEffect(() => {
		if (!workspace || !isTagsReady) return;

		getWorkspaceState().then(async (state) => {
			const { search, view, selectedTagId, openedNoteIds, activeNoteId } =
				state ?? {};

			await restoreFilter({
				search: search || undefined,
				view: view || undefined,
				selectedTagId: selectedTagId || undefined,
			});

			// Restore notes
			if (openedNoteIds && openedNoteIds.length > 0) {
				const notes = await workspace.notesRegistry.getById(openedNoteIds);
				if (!notes || notes.length === 0) return;

				dispatch(
					workspacesApi.setOpenedNotes({
						...workspaceData,
						notes,
					}),
				);

				const activeNote =
					(activeNoteId && notes.find((n) => n.id === activeNoteId)) ||
					notes[0];
				dispatch(
					workspacesApi.setActiveNote({
						...workspaceData,
						noteId: activeNote.id,
					}),
				);
			}

			dispatch(
				workspacesApi.setWorkspaceLoadingStatus({
					...workspaceData,
					changes: {
						isDataReady: true,
					},
				}),
			);
		});
	}, [
		workspace,
		workspaceData,
		getWorkspaceState,
		dispatch,
		restoreFilter,
		isTagsReady,
	]);
};
