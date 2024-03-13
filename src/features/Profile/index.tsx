import React, { FC } from 'react';
import { ProfileContainer } from '@features/App/useProfiles';
import { MainScreen } from '@features/MainScreen';
import { Workspace } from '@features/Workspace';

export type ProfileProps = {
	profile: ProfileContainer;
};

export const Profile: FC<ProfileProps> = ({ profile: currentProfile }) => {
	const activeProfileId = currentProfile.profile.id;

	// TODO: support multiple opened workspaces
	return (
		<Workspace profile={currentProfile}>
			<MainScreen key={activeProfileId} />
		</Workspace>
	);
};
