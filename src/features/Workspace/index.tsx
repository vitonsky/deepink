import React, { FC, useEffect } from 'react';
import { INote } from '@core/features/notes';
import { MainScreen } from '@features/MainScreen';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { SplashScreen } from '@features/SplashScreen';
import { useWorkspace } from '@features/Workspace/useWorkspace';
import { WorkspaceStatusBarItems } from '@features/Workspace/WorkspaceStatusBarItems';
import { ProfileContainer } from '@state/profiles/useProfiles';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectActiveWorkspace, workspacesApi } from '@state/redux/workspaces';

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

	// Close notes by unmount
	useEffect(() => {
		return () => {
			// TODO: use actual workspace id once will be implemented
			dispatch(workspacesApi.setActiveNote({ workspace: 'default', noteId: null }));
			dispatch(workspacesApi.setOpenedNotes({ workspace: 'default', notes: [] }));
			dispatch(workspacesApi.setNotes({ workspace: 'default', notes: [] }));
		};
	}, []);

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
				dispatch(workspacesApi.setTags({ workspace: 'default', tags }));
			});

		updateTags();

		const cleanup = tagsRegistry.onChange(updateTags);
		return cleanup;
	});

	const activeWorkspace = useAppSelector(selectActiveWorkspace);
	useEffect(() => {
		// TODO: Set specific workspace and profile
		dispatch(
			workspacesApi.setWorkspaces([
				{
					id: 'default',

					activeNote: null,
					openedNotes: [],
					notes: [],

					tags: {
						selected: null,
						list: [],
					},
				},
			]),
		);
		dispatch(workspacesApi.setActiveWorkspace('default'));
	}, [dispatch]);

	if (!workspace || !activeWorkspace) {
		return <SplashScreen />;
	}

	return (
		<WorkspaceProvider
			{...workspace}
			notesApi={{
				openNote: (note: INote, focus = true) => {
					dispatch(workspacesApi.addOpenedNote({ workspace: 'default', note }));

					if (focus) {
						dispatch(
							workspacesApi.setActiveNote({
								workspace: 'default',
								noteId: note.id,
							}),
						);
					}
				},
				noteUpdated: (note: INote) =>
					dispatch(
						workspacesApi.updateOpenedNote({ workspace: 'default', note }),
					),
				noteClosed: (noteId: string) =>
					dispatch(
						workspacesApi.removeOpenedNote({ workspace: 'default', noteId }),
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
