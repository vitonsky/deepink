import React, { createContext, FC } from 'react';
import { ProfileContainer } from '@features/App/useProfiles';
import { MainScreen } from '@features/MainScreen';
import { Workspace } from '@features/Workspace';
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
			<Workspace profile={currentProfile}>
				<MainScreen key={activeProfileId} />
			</Workspace>
		</ProfileControlsContext.Provider>
	);
};
