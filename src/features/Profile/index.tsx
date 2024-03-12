import React, { FC } from 'react';
import { MainScreen } from '@features/MainScreen';
import { dbContext } from '@features/Providers';
import { Workspace } from '@features/Workspace';
import { ProfileContainer } from '@state/profiles';

export type ProfileProps = {
	profile: ProfileContainer;
};

export const Profile: FC<ProfileProps> = ({ profile: currentProfile }) => {
	const activeProfileId = currentProfile.profile.id;

	return (
		<dbContext.Provider value={currentProfile.db}>
			<Workspace profile={currentProfile}>
				<MainScreen key={activeProfileId} />
			</Workspace>
		</dbContext.Provider>
	);
};
