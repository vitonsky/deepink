import React, { useMemo } from 'react';
import { isEqual } from 'lodash';
import { Box } from '@chakra-ui/react';
import { MainScreen } from '@features/MainScreen';
import { WorkspaceModalProvider } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveWorkspaceInfo,
	selectWorkspaceName,
} from '@state/redux/profiles/profiles';
import {
	selectIsWorkspaceLoaded,
	selectWorkspaceLoadingError,
} from '@state/redux/profiles/selectors/workspaceLoadingStatus';

import { SettingsWindow } from '../Settings/SettingsWindow';
import { WorkspaceLoadError } from './WorkspaceLoadError';
import { WorkspaceStatusBarItems } from './WorkspaceStatusBarItems';

export const Workspace = () => {
	const workspaceData = useWorkspaceData();

	const { name: workspaceName } = useWorkspaceSelector(selectWorkspaceName);
	const workspaceLoadingError = useWorkspaceSelector(selectWorkspaceLoadingError);
	const isWorkspaceLoaded = useWorkspaceSelector(selectIsWorkspaceLoaded);

	const activeWorkspace = useAppSelector(
		useMemo(
			() => selectActiveWorkspaceInfo({ profileId: workspaceData.profileId }),
			[workspaceData.profileId],
		),
		isEqual,
	);
	const isVisibleWorkspace = Boolean(
		activeWorkspace &&
		activeWorkspace.id === workspaceData.workspaceId &&
		(isWorkspaceLoaded || workspaceLoadingError),
	);

	return (
		<Box
			data-workspace={workspaceName}
			sx={{
				// Hide inactive workspace
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
				{workspaceLoadingError ? (
					<WorkspaceLoadError />
				) : (
					<>
						<MainScreen />
						<WorkspaceStatusBarItems />
						<SettingsWindow />
					</>
				)}
			</WorkspaceModalProvider>
		</Box>
	);
};
