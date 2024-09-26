import React, { FC, useEffect } from 'react';
import { INote } from '@core/features/notes';
import { MainScreen } from '@features/MainScreen';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { SplashScreen } from '@features/SplashScreen';
import { useWorkspace } from '@features/Workspace/useWorkspace';
import { WorkspaceStatusBarItems } from '@features/Workspace/WorkspaceStatusBarItems';
import { ProfileContainer } from '@state/profiles/useProfiles';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/workspaces/hooks';
import { selectActiveWorkspace, workspacesApi } from '@state/redux/workspaces/workspaces';

import { WorkspaceProvider } from './WorkspaceProvider';

export interface WorkspaceProps {
	profile: ProfileContainer;
}

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile }) => {
	const workspace = useWorkspace(profile);
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	// Close notes by unmount
	useEffect(() => {
		return () => {
			// TODO: use actual workspace id once will be implemented
			dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: null }));
			dispatch(workspacesApi.setOpenedNotes({ ...workspaceData, notes: [] }));
			dispatch(workspacesApi.setNotes({ ...workspaceData, notes: [] }));
		};
	}, [dispatch, workspaceData]);

	// Run optional services for active profile
	useEffect(() => {
		if (!workspace) return;

		const { filesRegistry } = workspace;

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();
	}, [workspace]);

	// TODO: replace to hook
	// Load tags
	useEffect(() => {
		if (!workspace) return;

		const { tagsRegistry } = workspace;
		const updateTags = () =>
			tagsRegistry.getTags().then((tags) => {
				dispatch(workspacesApi.setTags({ ...workspaceData, tags }));
			});

		updateTags();

		const cleanup = tagsRegistry.onChange(updateTags);
		return cleanup;
	}, [dispatch, workspace, workspaceData]);

	const activeWorkspace = useAppSelector(
		selectActiveWorkspace({ profileId: 'default' }),
	);
	useEffect(() => {
		// TODO: Set specific workspace and profile
		dispatch(
			workspacesApi.setProfiles({
				default: {
					activeWorkspace: 'default',
					workspaces: {
						default: {
							id: 'default',

							activeNote: null,
							openedNotes: [],
							notes: [],

							tags: {
								selected: null,
								list: [],
							},
						},
					},
				},
			}),
		);
		dispatch(workspacesApi.setActiveProfile('default'));
	}, [dispatch]);

	if (!workspace || !activeWorkspace) {
		return <SplashScreen />;
	}

	return (
		<WorkspaceProvider
			{...workspace}
			notesApi={{
				openNote: (note: INote, focus = true) => {
					dispatch(workspacesApi.addOpenedNote({ ...workspaceData, note }));

					if (focus) {
						dispatch(
							workspacesApi.setActiveNote({
								...workspaceData,
								noteId: note.id,
							}),
						);
					}
				},
				noteUpdated: (note: INote) =>
					dispatch(workspacesApi.updateOpenedNote({ ...workspaceData, note })),
				noteClosed: (noteId: string) =>
					dispatch(
						workspacesApi.removeOpenedNote({ ...workspaceData, noteId }),
					),
			}}
		>
			<StatusBarProvider>
				<MainScreen />
				<WorkspaceStatusBarItems />
			</StatusBarProvider>
		</WorkspaceProvider>
	);
};
