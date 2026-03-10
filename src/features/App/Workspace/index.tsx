import React, { createContext, FC, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { MainScreen } from '@features/MainScreen';
import { SplashScreen } from '@features/SplashScreen';
import { WorkspaceModalProvider } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveWorkspaceInfo,
	selectIsWorkspaceLoaded,
	selectWorkspaceName,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { SettingsWindow } from '../Settings/SettingsWindow';
import { useRestoreWorkspaceConfig } from './useRestoreWorkspaceConfig';
import { useRestoreWorkspaceState } from './useRestoreWorkspaceState';
import { useWorkspace } from './useWorkspace';
import { useWorkspaceTags } from './useWorkspaceTags';
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

const WorkspaceInitializer = () => {
	useWorkspaceTags();
	useRestoreWorkspaceState();
	useRestoreWorkspaceConfig();

	return null;
};

/**
 * Manage one workspace
 */
export const Workspace: FC<WorkspaceProps> = ({ profile }) => {
	const workspace = useWorkspace(profile);
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const { name: workspaceName } = useWorkspaceSelector(selectWorkspaceName);

	const isWorkspaceLoaded = useAppSelector(selectIsWorkspaceLoaded(workspaceData));
	const [isSplashVisible] = useDebounce(!isWorkspaceLoaded, 400);

	const activeWorkspace = useAppSelector(
		useMemo(
			() => selectActiveWorkspaceInfo({ profileId: workspaceData.profileId }),
			[workspaceData.profileId],
		),
		isEqual,
	);
	const isVisibleWorkspace =
		!isSplashVisible &&
		activeWorkspace &&
		activeWorkspace.id === workspaceData.workspaceId;

	return (
		<>
			{isSplashVisible && <SplashScreen />}
			{workspace ? (
				<WorkspaceProvider
					{...workspace}
					notesApi={{
						openNote: (note: INote, focus = true) => {
							dispatch(
								workspacesApi.addOpenedNote({ ...workspaceData, note }),
							);

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
					<WorkspaceInitializer />
					<WorkspaceServices />

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
				</WorkspaceProvider>
			) : null}
		</>
	);
};
