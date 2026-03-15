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
import {
	selectIsTagsReady,
	selectIsWorkspaceLoaded,
} from '@state/redux/profiles/selectors/loadingStatus';

import { useWorkspaceState } from './useWorkspaceState';
import { useNotesRegistry } from './WorkspaceProvider';

export const useRestoreWorkspace = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();
	const notesRegistry = useNotesRegistry();
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));

	const isTagsLoaded = useWorkspaceSelector(selectIsTagsReady);

	const isWorkspaceLoaded = useWorkspaceSelector(selectIsWorkspaceLoaded);
	const getWorkspaceState = useWorkspaceState({
		sync: isWorkspaceLoaded,
		profileId: workspaceData.profileId,
		workspaceId: workspaceData.workspaceId,
	});

	// Initialize workspace state
	useEffect(() => {
		if (!isTagsLoaded) return;

		const workspaceConfig = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

		Promise.all([getWorkspaceState(), workspaceConfig.get()]).then(
			async ([state, workspaceConfig]) => {
				// Restore workspace state if it exists
				if (state) {
					dispatch(
						workspaceActions.setFilters({
							search: state.search || null,
							view: state.view || null,
							selectedTagId: state.selectedTagId || null,
						}),
					);

					// Restore notes
					const { openedNoteIds, activeNoteId } = state;
					if (openedNoteIds && openedNoteIds.length > 0) {
						const notes = await notesRegistry.getById(openedNoteIds);
						if (notes && notes.length > 0) {
							dispatch(workspaceActions.setOpenedNotes({ notes }));

							const activeNote =
								(activeNoteId &&
									notes.find((n) => n.id === activeNoteId)) ||
								notes[0];
							dispatch(
								workspaceActions.setActiveNote({ noteId: activeNote.id }),
							);
						}
					}
				}

				// Restore config if it exist
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
						isOpenedNotesLoaded: true,
						isFiltersLoaded: true,
						isConfigLoaded: true,
					}),
				);
			},
		);
	}, [
		getWorkspaceState,
		isTagsLoaded,
		dispatch,
		workspaceActions,
		workspaceFiles,
		notesRegistry,
	]);
};
