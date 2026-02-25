import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import {
	NOTES_VIEW,
	WorkspaceConfigScheme,
	workspacesApi,
} from '@state/redux/profiles/profiles';

import { useProfileControls } from '../Profile';
import { WorkspaceContainer } from './useWorkspace';
import { useWorkspaceState } from './useWorkspaceState';

export const useSetupWorkspace = (workspace: WorkspaceContainer | null) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const controls = useProfileControls();

	const getWorkspaceState = useWorkspaceState({
		sync: Boolean(workspace),
		controls,
		workspaceId: workspaceData.workspaceId,
	});

	// Load workspace config
	useEffect(() => {
		const initConfig = async () => {
			const workspaceConfig = await new StateFile(
				new FileController(
					`workspaces/${workspaceData.workspaceId}/config.json`,
					controls.profile.files,
				),
				WorkspaceConfigScheme,
			).get();

			if (!workspaceConfig) return;

			const { title, tags } = workspaceConfig.newNote;

			dispatch(
				workspacesApi.setWorkspaceNoteTemplateConfig({
					...workspaceData,
					title,
					tags,
				}),
			);
		};

		initConfig();
	}, [controls.profile.files, dispatch, workspaceData]);

	// Init workspace state
	useEffect(() => {
		if (!workspace) return;

		const initWorkspace = async () => {
			try {
				const [persistedState, tags] = await Promise.all([
					getWorkspaceState(),
					workspace.tagsRegistry.getTags(),
				]);

				dispatch(workspacesApi.setTags({ ...workspaceData, tags }));

				if (!persistedState) return;
				const { search, view, selectedTagId, openedNoteIds, activeNoteId } =
					persistedState;

				// Restore base state
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
							view: view as NOTES_VIEW,
						}),
					);
				}

				// Restore selected tag only if it exists
				const selectedTag = tags.find((tag) => tag.id === selectedTagId);
				if (selectedTag) {
					dispatch(
						workspacesApi.setSelectedTag({
							...workspaceData,
							tag: selectedTag.id,
						}),
					);
				}

				// Restore notes
				if (!openedNoteIds || openedNoteIds.length === 0) return;

				const notes = await workspace.notesRegistry.getById(openedNoteIds);
				if (!notes || notes.length === 0) return;

				dispatch(
					workspacesApi.setOpenedNotes({
						...workspaceData,
						notes,
					}),
				);

				// Fallback to first note if saved active note is missing
				const activeNote = notes.find((n) => n.id === activeNoteId) ?? notes[0];
				dispatch(
					workspacesApi.setActiveNote({
						...workspaceData,
						noteId: activeNote.id,
					}),
				);
			} finally {
				dispatch(
					workspacesApi.setIsWorkspaceReady({
						...workspaceData,
						isReady: true,
					}),
				);
			}
		};

		initWorkspace();

		// Cleanup notes and ready state on unmount
		return () => {
			dispatch(
				workspacesApi.setIsWorkspaceReady({ ...workspaceData, isReady: false }),
			);

			dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: null }));
			dispatch(workspacesApi.setOpenedNotes({ ...workspaceData, notes: [] }));
			dispatch(workspacesApi.setNoteIds({ ...workspaceData, noteIds: [] }));
		};
	}, [workspace, workspaceData, getWorkspaceState, dispatch]);

	// Sync tag changes with the store
	useEffect(() => {
		if (!workspace) return;

		return workspace.tagsRegistry.onChange(() => {
			workspace.tagsRegistry.getTags().then((tags) => {
				dispatch(workspacesApi.setTags({ ...workspaceData, tags }));
			});
		});
	}, [workspace, workspaceData, dispatch]);
};
