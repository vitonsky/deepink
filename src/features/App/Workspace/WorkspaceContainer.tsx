import React, { createContext, FC, PropsWithChildren } from 'react';
import { INote } from '@core/features/notes';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceSelector } from '@state/redux/profiles/hooks';
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
 * Restores workspace state
 */
const WorkspaceInitializer = () => {
	useWorkspaceTags();
	useRestoreWorkspace();

	return null;
};

/**
 * Manages one workspace: sets up providers and handles data initialization
 */
export const WorkspaceContainer: FC<PropsWithChildren<WorkspaceContainerProps>> = ({
	profile,
	children,
}) => {
	const workspace = useWorkspace(profile);
	const dispatch = useAppDispatch();
	const workspaceActions = useWorkspaceActions();

	const workspaceLoadingError = useWorkspaceSelector(selectWorkspaceLoadingError);

	if (!workspace) return null;

	return (
		<WorkspaceProvider
			{...workspace}
			notesApi={{
				openNote: (note: INote, focus = true) => {
					dispatch(workspaceActions.addOpenedNote({ note }));
					if (focus) {
						dispatch(
							workspaceActions.setActiveNote({
								noteId: note.id,
							}),
						);
					}
				},
				noteUpdated: (note: INote) =>
					dispatch(
						workspaceActions.updateOpenedNote({
							note,
						}),
					),
				noteClosed: (noteId: string) =>
					dispatch(
						workspaceActions.removeOpenedNote({
							noteId,
						}),
					),
			}}
		>
			{/* Unmount the component on error to reset all effects.
			When the error is cleared, it mounts again and retries the initialization of data */}
			{!workspaceLoadingError && <WorkspaceInitializer />}

			<WorkspaceServices />

			{children}
		</WorkspaceProvider>
	);
};
