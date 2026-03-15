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
import {
	selectIsTagsLoaded,
	WorkspaceConfigScheme,
} from '@state/redux/profiles/profiles';

import { WorkspaceStateScheme } from './services/useWorkspaceStateSync';
import { useNotesRegistry } from './WorkspaceProvider';

export const useRestoreWorkspace = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();

	const notesRegistry = useNotesRegistry();
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));

	const isTagsLoaded = useWorkspaceSelector(selectIsTagsLoaded);

	useEffect(() => {
		// Don’t restore filters until tags are loaded, or selectedTagId will be ignored
		if (!isTagsLoaded) return;

		const workspaceConfig = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

		const workspaceState = new StateFile(
			new FileController(`state.json`, workspaceFiles),
			WorkspaceStateScheme,
		);

		Promise.all([workspaceState.get(), workspaceConfig.get()]).then(
			async ([state, workspaceConfig]) => {
				// Restore workspace state if it exists
				if (state) {
					dispatch(
						workspaceActions.setFilters({
							search: state.search,
							view: state.view,
							selectedTagId: state.selectedTagId || undefined,
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
	}, [dispatch, workspaceActions, workspaceFiles, notesRegistry, isTagsLoaded]);
};
