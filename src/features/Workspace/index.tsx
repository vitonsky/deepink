import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import { AppContext } from '@features/App';
import { createNotesApi } from '@state/notes';
import { createTagsApi } from '@state/tags';
import { createWorkspaceApi } from '@state/workspace';
import { DisposableBox } from '@utils/disposable';

import { WorkspaceProvider } from './WorkspaceProvider';

export interface WorkspaceProps extends PropsWithChildren {
	profile: DisposableBox<AppContext>;
}

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile, children }) => {
	const [workspaceApi] = useState(createWorkspaceApi);
	const [tagsApi] = useState(createTagsApi);
	const [notesApi] = useState(createNotesApi);

	// Close notes by unmount
	useEffect(() => {
		return () => notesApi.events.notesClosed();
	}, [notesApi.events, profile]);

	// Run optional services for active profile
	useEffect(() => {
		if (profile.isDisposed()) return;

		const { filesRegistry } = profile.getContent();

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();
	}, [profile]);

	// TODO: replace to hook
	// Load tags
	useEffect(() => {
		if (profile.isDisposed()) return;

		const { tagsRegistry } = profile.getContent();
		const updateTags = () => tagsRegistry.getTags().then(tagsApi.events.tagsUpdated);

		const cleanup = workspaceApi.events.tagsUpdateRequested.watch(updateTags);
		updateTags();

		return cleanup;
	});

	return (
		<WorkspaceProvider {...{ workspaceApi, notesApi, tagsApi }}>
			{children}
		</WorkspaceProvider>
	);
};
