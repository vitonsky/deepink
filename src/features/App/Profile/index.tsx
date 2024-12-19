import React, { createContext, FC, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	createWorkspaceObject,
	selectWorkspacesInfo,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileContainer } from '../Profiles/hooks/useProfileContainers';
import { Workspace, WorkspaceContext } from '../Workspace';
import { ProfileStatusBar } from './ProfileStatusBar/ProfileStatusBar';
import { useProfileSyncButton } from './ProfileStatusBar/useProfileSyncButton';

export type ProfileControls = {
	profile: ProfileContainer;
	close: () => void;
};

export const ProfileControlsContext = createContext<ProfileControls | null>(null);
export const useProfileControls = createContextGetterHook(ProfileControlsContext);

export type ProfileProps = {
	profile: ProfileContainer;
	controls: ProfileControls;
};

export const Profile: FC<ProfileProps> = ({ profile: currentProfile, controls }) => {
	const dispatch = useAppDispatch();

	const profileId = currentProfile.profile.id;

	const workspaces = useAppSelector(
		useMemo(() => selectWorkspacesInfo({ profileId }), [profileId]),
		isEqual,
	);

	const workspacesManager = useMemo(
		() => new WorkspacesController(currentProfile.db),
		[currentProfile.db],
	);
	useEffect(() => {
		workspacesManager.getList().then((workspaces) => {
			const [defaultWorkspace] = workspaces;

			if (!defaultWorkspace) return;

			dispatch(
				workspacesApi.addProfile({
					profileId,
					profile: {
						activeWorkspace: null,
						workspaces: Object.fromEntries(
							workspaces.map((workspace) => [
								workspace.id,
								createWorkspaceObject(workspace),
							]),
						),
					},
				}),
			);
			dispatch(workspacesApi.setActiveProfile(profileId));
			dispatch(
				workspacesApi.setActiveWorkspace({
					profileId,
					workspaceId: defaultWorkspace.id,
				}),
			);
		});

		return () => {
			dispatch(
				workspacesApi.removeProfile({
					profileId,
				}),
			);
		};
	}, [dispatch, profileId, workspacesManager]);

	useProfileSyncButton();

	return (
		<ProfileControlsContext.Provider value={controls}>
			{workspaces.map((workspace) =>
				workspace.touched ? (
					<WorkspaceContext.Provider
						key={workspace.id}
						value={{ profileId: profileId, workspaceId: workspace.id }}
					>
						<Workspace profile={currentProfile} />
					</WorkspaceContext.Provider>
				) : null,
			)}
			<ProfileStatusBar />
		</ProfileControlsContext.Provider>
	);
};
