import React, { createContext, FC } from 'react';
import { Workspace } from '@features/Workspace';
import { ProfileContainer } from '@state/profiles/useProfiles';
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
	const activeProfileId = currentProfile.profile.id;

	// TODO: support multiple opened workspaces
	return (
		<ProfileControlsContext.Provider value={controls}>
			<Workspace profile={currentProfile} key={activeProfileId} />
		</ProfileControlsContext.Provider>
	);
};
