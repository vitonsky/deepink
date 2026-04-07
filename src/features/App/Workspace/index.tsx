import React, { createContext, FC, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { MainScreen } from '@features/MainScreen';
import { WorkspaceModalProvider } from '@features/WorkspaceModal/useWorkspaceModal';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectWorkspaceName } from '@state/redux/profiles/profiles';
import { selectIsWorkspaceLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { SettingsWindow } from '../Settings/SettingsWindow';
import { WorkspaceServices } from './services/WorkspaceServices';
import { useWorkspace } from './useWorkspace';
import { WorkspaceLoader } from './WorkspaceLoader';
import { WorkspaceProvider } from './WorkspaceProvider';
import { WorkspaceStatusBarItems } from './WorkspaceStatusBarItems';

export const WorkspaceContext = createContext<{
	workspaceId: string;
	profileId: string;
} | null>(null);
export const useWorkspaceContext = createContextGetterHook(WorkspaceContext);

export interface WorkspaceProps {
	profile: ProfileContainer;
}

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile }) => {
	const workspace = useWorkspace(profile);
	const dispatch = useAppDispatch();
	const workspaceActions = useWorkspaceActions();

	// TODO: replace to hook
	// Keeps the tags list up to date: subscribes to tag changes in the database and syncs updates to Redux
	useEffect(() => {
		if (!workspace) return;
		const { tagsRegistry } = workspace;

		let isCanceled = false;

		const updateTags = () =>
			tagsRegistry.getTags().then((tags) => {
				if (isCanceled) return;
				dispatch(workspaceActions.setTags({ tags }));
			});

		const cleanup = tagsRegistry.onChange(updateTags);
		return () => {
			isCanceled = true;
			cleanup();
		};
	}, [dispatch, workspace, workspaceActions]);

	const { name: workspaceName } = useWorkspaceSelector(selectWorkspaceName);

	const isWorkspaceLoaded = useWorkspaceSelector(selectIsWorkspaceLoaded);
	const isVisibleWorkspace = useIsActiveWorkspace();

	if (!workspace) return null;

	return (
		<Box
			data-workspace={workspaceName}
			sx={{
				display: isVisibleWorkspace ? 'flex' : 'none',
				flexDirection: 'column',
				flexGrow: '100',
				width: '100%',
				height: '100vh',
				maxWidth: '100%',
				maxHeight: '100%',
				backgroundColor: 'surface.background',
			}}
		>
			<WorkspaceProvider
				{...workspace}
				notesApi={{
					openNote: (note: INote, focus = true) => {
						dispatch(workspaceActions.addOpenedNote({ note }));
						if (focus) {
							dispatch(workspaceActions.setActiveNote({ noteId: note.id }));
						}
					},
					noteUpdated: (note: INote) =>
						dispatch(workspaceActions.updateOpenedNote({ note })),
					noteClosed: (noteId: string) =>
						dispatch(workspaceActions.removeOpenedNote({ noteId })),
				}}
			>
				<WorkspaceServices />

				{!isWorkspaceLoaded && <WorkspaceLoader />}
				{isWorkspaceLoaded && (
					<WorkspaceModalProvider isVisible={isVisibleWorkspace ?? false}>
						<MainScreen />
						<WorkspaceStatusBarItems />
						<SettingsWindow />
					</WorkspaceModalProvider>
				)}
			</WorkspaceProvider>
		</Box>
	);
};
