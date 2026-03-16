import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { INote } from '@core/features/notes';
import { useAppDispatch } from '@state/redux/hooks';
import {
	useWorkspaceActions,
	useWorkspaceData,
	useWorkspaceSelector,
} from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';
import { selectWorkspaceLoadingError } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { WorkspaceServices } from './services/WorkspaceServices';
import { useRestoreWorkspace } from './useRestoreWorkspace';
import { useWorkspace } from './useWorkspace';
import { useWorkspaceTags } from './useWorkspaceTags';
import { WorkspaceProvider } from './WorkspaceProvider';

export const WorkspaceContext = createContext<{
	workspaceId: string;
	profileId: string;
} | null>(null);
export const useWorkspaceContext = createContextGetterHook(WorkspaceContext);

export interface WorkspaceContainerProps {
	profile: ProfileContainer;
}

/**
 * Loads tags and restores previous workspace state
 */
const WorkspaceInitializer = () => {
	const dispatch = useAppDispatch();
	const workspaceActions = useWorkspaceActions();

	const handleError = useCallback(
		(errorMessage: string) => {
			dispatch(
				workspaceActions.setWorkspaceLoadingError({
					errorMessage,
				}),
			);
		},
		[dispatch, workspaceActions],
	);

	useWorkspaceTags({ onError: handleError });
	useRestoreWorkspace({ onError: handleError });

	return null;
};

/**
 * Manage one workspace
 * Sets up providers and services for a workspace
 */
export const WorkspaceContainer: FC<PropsWithChildren<WorkspaceContainerProps>> = ({
	profile,
	children,
}) => {
	const workspace = useWorkspace(profile);
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const workspaceLoadingError = useWorkspaceSelector(selectWorkspaceLoadingError);

	if (!workspace) return null;

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
					dispatch(
						workspacesApi.updateOpenedNote({
							...workspaceData,
							note,
						}),
					),
				noteClosed: (noteId: string) =>
					dispatch(
						workspacesApi.removeOpenedNote({
							...workspaceData,
							noteId,
						}),
					),
			}}
		>
			{/* Unmount the component on error to reset all effects.
            When the error is cleared, it mounts again and retries the restore */}
			{!workspaceLoadingError && <WorkspaceInitializer />}

			<WorkspaceServices />

			{children}
		</WorkspaceProvider>
	);
};
