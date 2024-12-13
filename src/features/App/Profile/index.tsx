import React, { createContext, FC, useEffect, useMemo } from 'react';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/profiles/profiles';
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

	const workspaces = useAppSelector(selectWorkspaces({ profileId }));

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
						activeWorkspace: defaultWorkspace.id,
						workspaces: Object.fromEntries(
							workspaces.map((workspace) => [
								workspace.id,
								{
									id: workspace.id,
									name: workspace.name,

									activeNote: null,
									openedNotes: [],
									notes: [],

									tags: {
										selected: null,
										list: [],
									},
								},
							]),
						),
					},
				}),
			);
			dispatch(workspacesApi.setActiveProfile(profileId));
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
			{workspaces.map((workspace) => (
				<WorkspaceContext.Provider
					key={workspace.id}
					value={{ profileId: profileId, workspaceId: workspace.id }}
				>
					<Workspace profile={currentProfile} />
				</WorkspaceContext.Provider>
			))}
			<ProfileStatusBar />
		</ProfileControlsContext.Provider>
	);
};
