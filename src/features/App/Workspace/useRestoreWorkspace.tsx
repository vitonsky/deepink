import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceData } from '@state/redux/profiles/hooks';
import { NOTES_VIEW, WorkspaceConfigScheme } from '@state/redux/profiles/profiles';

import { WorkspaceStateScheme } from './services/useWorkspaceStateSync';
import { useNotesRegistry, useTagsRegistry } from './WorkspaceProvider';
import { useWorkspaceErrorHandlerContext } from '.';

/**
 * Restores workspace state on startup: tags, filters, config, and opened notes.
 */
export const useRestoreWorkspace = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();

	const { handleError } = useWorkspaceErrorHandlerContext();

	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const workspaceStorage = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));

	useEffect(() => {
		const workspaceConfig = new StateFile(
			new FileController(`config.json`, workspaceStorage),
			WorkspaceConfigScheme,
		);

		const workspaceState = new StateFile(
			new FileController(`state.json`, workspaceStorage),
			WorkspaceStateScheme,
		);

		Promise.all([workspaceState.get(), workspaceConfig.get(), tagsRegistry.getTags()])
			.then(async ([state, config, tags]) => {
				// Tags are loaded as part of the workspace state (required for it to function)
				// The selected tag must be validated against the available tag list before restoring filters - invalid tags will be ignored
				dispatch(workspaceActions.setTags({ tags: tags }));

				let selectedTagId;
				if (tags.length > 0 && state?.selectedTagId) {
					selectedTagId =
						tags.find((t) => t.id === state?.selectedTagId)?.id ?? undefined;
				}

				// Restore filters
				if (state) {
					dispatch(
						workspaceActions.setFilters({
							search: state.search,
							view: state.view,
							selectedTagId,
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
				const [noteIdList, openedNoteList] = await Promise.all([
					notesRegistry.query({
						tags: selectedTagId ? [selectedTagId] : [],
						search: state?.search ? { text: state.search } : undefined,
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

				// Restore notes list
				dispatch(workspaceActions.setNoteIds({ noteIds: noteIdList }));

				// Restore opened notes
				if (openedNoteList && openedNoteList.length > 0) {
					dispatch(workspaceActions.setOpenedNotes({ notes: openedNoteList }));

					const activeNote =
						(state?.activeNoteId &&
							openedNoteList.find((n) => n.id === state.activeNoteId)) ||
						openedNoteList[0];
					dispatch(workspaceActions.setActiveNote({ noteId: activeNote.id }));
				}

				dispatch(
					workspaceActions.setWorkspaceLoadingStatus({
						isOpenedNotesLoaded: true,
						isFiltersLoaded: true,
						isConfigLoaded: true,
						isNoteIdsLoaded: true,
						isTagsLoaded: true,
					}),
				);
			})
			.catch((error) => {
				handleError(error);
			});
	}, [
		dispatch,
		workspaceActions,
		workspaceStorage,
		notesRegistry,
		tagsRegistry,
		handleError,
	]);
};
