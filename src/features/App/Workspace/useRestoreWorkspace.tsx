import { useEffect, useRef } from 'react';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceData } from '@state/redux/profiles/hooks';

import {
	createWorkspaceConfigFile,
	createWorkspaceStateFile,
} from './utils/createWorkspaceStateFiles';
import { useWorkspaceError } from './WorkspaceErrorProvider';
import { useNotesRegistry, useTagsRegistry } from './WorkspaceProvider';

/**
 * Restores workspace state: tags, filters, config, and opened notes
 */
export const useRestoreWorkspace = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();
	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const workspaceStorage = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));

	const updateNoteList = useUpdateNotes();
	const updateNoteListRef = useRef(updateNoteList);
	updateNoteListRef.current = updateNoteList;

	const handleError = useWorkspaceError();

	useEffect(() => {
		const workspaceState = createWorkspaceStateFile(workspaceStorage);
		const workspaceConfig = createWorkspaceConfigFile(workspaceStorage);

		Promise.all([workspaceState.get(), tagsRegistry.getTags(), workspaceConfig.get()])
			.then(async ([state, tags, config]) => {
				// Tags are loaded as part of the workspace state
				dispatch(workspaceActions.setTags({ tags }));

				// Restore filters
				if (state) {
					// Validate selected tags against the tags list - invalid tags will be ignored
					let selectedTag;
					if (tags.length > 0 && state.selectedTagId) {
						selectedTag =
							tags.find((tag) => tag.id === state.selectedTagId) ||
							undefined;
					}

					dispatch(
						workspaceActions.setFilters({
							search: state.search,
							view: state.view,
							selectedTagId: selectedTag ? selectedTag.id : undefined,
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
				await updateNoteListRef.current();

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
