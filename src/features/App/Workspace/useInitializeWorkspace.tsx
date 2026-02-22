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

export const useInitializeWorkspace = (workspace: WorkspaceContainer | null) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const controls = useProfileControls();

	const getWorkspaceState = useWorkspaceState({
		sync: true,
		controls,
		workspaceId: workspaceData.workspaceId,
	});

	// Load config
	useEffect(() => {
		const loadConfig = async () => {
			const config = await new StateFile(
				new FileController(
					`workspaces/${workspaceData.workspaceId}/config.json`,
					controls.profile.files,
				),
				WorkspaceConfigScheme,
			).get();

			dispatch(
				workspacesApi.setWorkspaceNoteTemplateConfig({
					...workspaceData,
					title: config?.newNote.title,
					tags: config?.newNote.tags,
				}),
			);
		};
		loadConfig();
	}, [controls.profile.files, dispatch, workspaceData, workspaceData.workspaceId]);

	useEffect(() => {
		if (!workspace) return;

		const cleanupTags = workspace.tagsRegistry.onChange(async () => {
			workspace.tagsRegistry.getTags().then((tags) => {
				dispatch(workspacesApi.setTags({ ...workspaceData, tags }));
			});
		});

		const initWorkspace = async () => {
			try {
				const [state, tags] = await Promise.all([
					getWorkspaceState(),
					workspace.tagsRegistry.getTags(),
				]);
				dispatch(workspacesApi.setTags({ ...workspaceData, tags }));

				if (!state) return;

				if (state.view) {
					dispatch(
						workspacesApi.setView({
							...workspaceData,
							view: state.view as NOTES_VIEW,
						}),
					);
				}

				dispatch(
					workspacesApi.setSearch({
						...workspaceData,
						search: state.search || '',
					}),
				);

				const hasSelectedTag = tags.some((tag) => tag.id === state.selectedTagId);
				if (hasSelectedTag) {
					dispatch(
						workspacesApi.setSelectedTag({
							...workspaceData,
							tag: state.selectedTagId || null,
						}),
					);
				}

				if (!state.openedNoteIds || state.openedNoteIds.length === 0) return;
				const notes = await workspace.notesRegistry.getById(state.openedNoteIds);
				if (!notes || notes.length === 0) return;

				dispatch(workspacesApi.setOpenedNotes({ ...workspaceData, notes }));
				dispatch(
					workspacesApi.setActiveNote({
						...workspaceData,
						noteId: state.activeNoteId || null,
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

		// Close notes by unmount
		return () => {
			cleanupTags();

			dispatch(
				workspacesApi.setIsWorkspaceReady({ ...workspaceData, isReady: false }),
			);

			dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: null }));
			dispatch(workspacesApi.setOpenedNotes({ ...workspaceData, notes: [] }));
			dispatch(workspacesApi.setNoteIds({ ...workspaceData, noteIds: [] }));
		};
	}, [workspace, workspaceData, getWorkspaceState, dispatch]);
};
