import React, { FC } from 'react';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { useAppSelector } from '@state/redux/hooks';
import { selectIsActiveWorkspaceReady } from '@state/redux/profiles/profiles';

import { ProfileStatusBar } from '../Profile/ProfileStatusBar/ProfileStatusBar';
import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { useWorkspace } from './useWorkspace';
import { useWorkspaceInitialization } from './useWorkspaceInitialization';
import { Workspace, WorkspaceContext } from '.';

type WorkspaceContainerProps = {
	profile: ProfileContainer;
	workspaceId: string;
	children?: React.ReactNode;
};

export const WorkspaceContainer: FC<WorkspaceContainerProps> = ({
	profile,
	workspaceId,
	children,
}) => {
	const workspace = useWorkspace(profile, workspaceId);

	const profileId = profile.profile.id;

	useWorkspaceInitialization(workspace, profileId, workspaceId);

	const isActiveWorkspaceReady = useAppSelector(
		selectIsActiveWorkspaceReady({ profileId }),
	);

	// Do not render until the workspace is ready
	if (!isActiveWorkspaceReady) return null;

	return (
		<WorkspaceContext.Provider value={{ profileId, workspaceId: workspaceId }}>
			<StatusBarProvider>
				<Workspace workspace={workspace} />
				<ProfileStatusBar />

				{children}
			</StatusBarProvider>
		</WorkspaceContext.Provider>
	);
};
