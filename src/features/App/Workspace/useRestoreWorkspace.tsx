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
	NOTES_VIEW,
	selectIsTagsLoaded,
	WorkspaceConfigScheme,
} from '@state/redux/profiles/profiles';

import { WorkspaceStateScheme } from './services/useWorkspaceStateSync';
import { useNotesRegistry } from './WorkspaceProvider';

export const useRestoreWorkspace = ({
	onError,
}: {
	onError: (message: string) => void;
}) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();

	const notesRegistry = useNotesRegistry();
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));

	const isTagsLoaded = useWorkspaceSelector(selectIsTagsLoaded);
	useEffect(() => {
		// Must wait for tags to be loaded first,
		// otherwise selectedTagId from state will be ignored
		if (!isTagsLoaded) return;

		const workspaceConfig = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

		const workspaceState = new StateFile(
			new FileController(`state.json`, workspaceFiles),
			WorkspaceStateScheme,
		);

		Promise.all([workspaceState.get(), workspaceConfig.get()])
			.then(async ([state, workspaceConfig]) => {
				// Restore workspace state if it exists
				if (state) {
					dispatch(
						workspaceActions.setFilters({
							search: state.search,
							view: state.view,
							selectedTagId: state.selectedTagId || undefined,
						}),
					);

					// Restore opened notes
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

				// Restore notes list
				const tags =
					state && state.selectedTagId !== null ? [state.selectedTagId] : [];
				const noteIds = await notesRegistry.query({
					tags,
					sort: { by: 'updatedAt', order: 'desc' },
					search: state?.search
						? {
								text: state.search,
							}
						: undefined,
					meta: {
						isDeleted: state?.view === NOTES_VIEW.BIN,
						// show archived notes only in archive view
						// but do not filter by the archived flag in bin view
						...(state?.view !== NOTES_VIEW.BIN && {
							isArchived: state?.view === NOTES_VIEW.ARCHIVE,
						}),
						...(state?.view === NOTES_VIEW.BOOKMARK && {
							isBookmarked: true,
						}),
					},
				});
				if (noteIds.length > 0) {
					dispatch(workspaceActions.setNoteIds({ noteIds }));
				}

				dispatch(
					workspaceActions.setWorkspaceLoadingStatus({
						isOpenedNotesLoaded: true,
						isFiltersLoaded: true,
						isConfigLoaded: true,
						isNoteIdsLoaded: true,
					}),
				);
			})
			.catch((error) => {
				console.error(error);
				onError(error.message);
			});
	}, [
		dispatch,
		workspaceActions,
		workspaceFiles,
		notesRegistry,
		isTagsLoaded,
		onError,
	]);
};
