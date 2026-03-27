import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { Box } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { MainScreen } from '@features/MainScreen';
import { WorkspaceModalProvider } from '@features/WorkspaceModal/useWorkspaceModal';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';
import { useAppDispatch } from '@state/redux/hooks';
import {
	useWorkspaceActions,
	useWorkspaceData,
	useWorkspaceSelector,
} from '@state/redux/profiles/hooks';
import { selectWorkspaceName, workspacesApi } from '@state/redux/profiles/profiles';
import { selectIsWorkspaceLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { SettingsWindow } from '../Settings/SettingsWindow';
import { WorkspaceServices } from './services/WorkspaceServices';
import { useRestoreWorkspace } from './useRestoreWorkspace';
import { useSubscribeToTagChanges } from './useSubscribeToTagChanges';
import { useWorkspace } from './useWorkspace';
import { WorkspaceProvider } from './WorkspaceProvider';
import { WorkspaceStatusBarItems } from './WorkspaceStatusBarItems';

export const WorkspaceContext = createContext<{
	workspaceId: string;
	profileId: string;
} | null>(null);
export const useWorkspaceContext = createContextGetterHook(WorkspaceContext);

export const WorkspaceErrorHandlerContext = createContext<{
	handleError: (error: Error) => void;
} | null>(null);
export const useWorkspaceErrorHandlerContext = createContextGetterHook(
	WorkspaceErrorHandlerContext,
);

export const WorkspaceErrorHandlerProvider: FC<
	PropsWithChildren<{ onError: (error: Error) => void }>
> = ({ children, onError }) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			onError(error);

			dispatch(workspacesApi.resetWorkspace(workspaceData));
		},
		[dispatch, onError, workspaceData],
	);

	return (
		<WorkspaceErrorHandlerContext.Provider value={{ handleError }}>
			{children}
		</WorkspaceErrorHandlerContext.Provider>
	);
};

export interface WorkspaceProps {
	profile: ProfileContainer;
}

const WorkspaceInitializer = () => {
	useRestoreWorkspace();
	useSubscribeToTagChanges();

	return null;
};

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile }) => {
	const workspace = useWorkspace(profile);
	const dispatch = useAppDispatch();
	const workspaceActions = useWorkspaceActions();

	const { name: workspaceName } = useWorkspaceSelector(selectWorkspaceName);
	const isWorkspaceLoaded = useWorkspaceSelector(selectIsWorkspaceLoaded);

	const isVisibleWorkspace = useIsActiveWorkspace();

	if (!workspace) return null;

	return (
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
			<WorkspaceInitializer />
			<WorkspaceServices />

			{isWorkspaceLoaded ? (
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
					<WorkspaceModalProvider isVisible={isVisibleWorkspace ?? false}>
						<MainScreen />
						<WorkspaceStatusBarItems />
						<SettingsWindow />
					</WorkspaceModalProvider>
				</Box>
			) : null}
		</WorkspaceProvider>
	);
};
