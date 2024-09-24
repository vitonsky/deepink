import React, { FC, useEffect, useState } from 'react';
import { MainScreen } from '@features/MainScreen';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { SplashScreen } from '@features/SplashScreen';
import { useWorkspace } from '@features/Workspace/useWorkspace';
import { WorkspaceStatusBarItems } from '@features/Workspace/WorkspaceStatusBarItems';
import { createNotesApi } from '@state/notes';
import { ProfileContainer } from '@state/profiles/useProfiles';
import { createTagsApi } from '@state/tags';
import { createWorkspaceApi } from '@state/workspace';

import { WorkspaceProvider } from './WorkspaceProvider';

export interface WorkspaceProps {
	profile: ProfileContainer;
}

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile }) => {
	const [workspaceApi] = useState(createWorkspaceApi);
	const [tagsApi] = useState(createTagsApi);
	const [notesApi] = useState(createNotesApi);

	const workspace = useWorkspace(profile);

	// Close notes by unmount
	useEffect(() => {
		return () => notesApi.events.notesClosed();
	}, [notesApi.events, profile]);

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
		const updateTags = () => tagsRegistry.getTags().then(tagsApi.events.tagsUpdated);

		const cleanup = workspaceApi.events.tagsUpdateRequested.watch(updateTags);
		updateTags();

		return cleanup;
	});

	if (!workspace) {
		return <SplashScreen />;
	}

	return (
		<WorkspaceProvider {...{ workspaceApi, notesApi, tagsApi, ...workspace }}>
			<StatusBarProvider>
				<MainScreen />
				<WorkspaceStatusBarItems />
			</StatusBarProvider>
		</WorkspaceProvider>
	);
};
