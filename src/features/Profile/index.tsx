import React, { createContext, FC, useEffect } from 'react';
import { Workspace, WorkspaceContext } from '@features/Workspace';
import { ProfileContainer } from '@state/profiles/useProfiles';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/profiles/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type ProfileControls = {
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

	useEffect(() => {
		dispatch(
			workspacesApi.addProfile({
				profileId,
				profile: {
					activeWorkspace: 'default',
					workspaces: {
						default: {
							id: 'default',

							activeNote: null,
							openedNotes: [],
							notes: [],

							tags: {
								selected: null,
								list: [],
							},
						},
					},
				},
			}),
		);
		dispatch(workspacesApi.setActiveProfile(profileId));

		return () => {
			dispatch(
				workspacesApi.removeProfile({
					profileId,
				}),
			);
		};
	}, [dispatch, profileId]);

	console.log({ workspaces });

	// TODO: support multiple opened workspaces
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
		</ProfileControlsContext.Provider>
	);
};
