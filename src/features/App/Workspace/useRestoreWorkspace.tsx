import { useEffect, useRef } from 'react';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceData } from '@state/redux/profiles/hooks';

import { createWorkspaceStateFiles } from './utils/createWorkspaceStateFiles';
import { useWorkspaceErrorHandlerContext } from './WorkspaceErrorHandlerContext';
import { useNotesRegistry, useTagsRegistry } from './WorkspaceProvider';

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

	const loadNotes = useUpdateNotes();
	const loadNotesRef = useRef(loadNotes);
	loadNotesRef.current = loadNotes;

	useEffect(() => {
		const { workspaceConfig, workspaceState } =
			createWorkspaceStateFiles(workspaceStorage);

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

				// Restore opened notes
				if (state && state.openedNoteIds && state.openedNoteIds.length > 0) {
					const openedNoteList = await notesRegistry.getById(
						state.openedNoteIds,
					);

					if (openedNoteList && openedNoteList.length > 0) {
						dispatch(
							workspaceActions.setOpenedNotes({ notes: openedNoteList }),
						);

						let activeNote = openedNoteList[0];
						if (state.activeNoteId) {
							activeNote =
								openedNoteList.find((n) => n.id === state.activeNoteId) ||
								openedNoteList[0];
						}
						dispatch(
							workspaceActions.setActiveNote({ noteId: activeNote.id }),
						);
					}
				}

				// Restore notes list
				await loadNotesRef.current();

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
