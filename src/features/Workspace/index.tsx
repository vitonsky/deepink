import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import {
	attachmentsControllerContext,
	filesRegistryContext,
	notesRegistryContext,
	tagsRegistryContext,
} from '@features/Providers';
import { SplashScreen } from '@features/SplashScreen';
import { useWorkspace } from '@features/Workspace/useWorkspace';
import { createNotesApi } from '@state/notes';
import { ProfileContainer } from '@state/profiles';
import { createTagsApi } from '@state/tags';
import { createWorkspaceApi } from '@state/workspace';

import { WorkspaceProvider } from './WorkspaceProvider';

export interface WorkspaceProps extends PropsWithChildren {
	profile: ProfileContainer;
}

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile, children }) => {
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

	// TODO: move providers to workspace provider
	return (
		<WorkspaceProvider {...{ workspaceApi, notesApi, tagsApi }}>
			<filesRegistryContext.Provider value={workspace.filesRegistry}>
				<attachmentsControllerContext.Provider
					value={workspace.attachmentsController}
				>
					<tagsRegistryContext.Provider value={workspace.tagsRegistry}>
						<notesRegistryContext.Provider value={workspace.notesRegistry}>
							{children}
						</notesRegistryContext.Provider>
					</tagsRegistryContext.Provider>
				</attachmentsControllerContext.Provider>
			</filesRegistryContext.Provider>
		</WorkspaceProvider>
	);
};
