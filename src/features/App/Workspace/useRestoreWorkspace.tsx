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
			.then(async ([state, config]) => {
				// Restore filters
				if (state) {
					dispatch(
						workspaceActions.setFilters({
							search: state.search,
							view: state.view,
							selectedTagId: state.selectedTagId || undefined,
						}),
					);
				}

				// Restore config if it exists
				if (config) {
					dispatch(
						workspaceActions.setWorkspaceNoteTemplateConfig({
							title: config.newNote.title,
							tags: config.newNote.tags,
						}),
					);
				}

				// Get opened notes and notes list
				const tags =
					state && state.selectedTagId !== null ? [state.selectedTagId] : [];
				const search = state && state.search ? { text: state.search } : undefined;
				const [noteIds, openedNotes] = await Promise.all([
					notesRegistry.query({
						tags,
						search,
						sort: { by: 'updatedAt', order: 'desc' },
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
					}),

					state?.openedNoteIds && state?.openedNoteIds.length > 0
						? notesRegistry.getById(state.openedNoteIds)
						: Promise.resolve(null),
				]);

				// Restore opened notes
				if (openedNotes && openedNotes.length > 0) {
					dispatch(workspaceActions.setOpenedNotes({ notes: openedNotes }));

					const activeNote =
						(state?.activeNoteId &&
							openedNotes.find((n) => n.id === state.activeNoteId)) ||
						openedNotes[0];
					dispatch(workspaceActions.setActiveNote({ noteId: activeNote.id }));
				}

				// Restore notes list
				dispatch(workspaceActions.setNoteIds({ noteIds }));

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
