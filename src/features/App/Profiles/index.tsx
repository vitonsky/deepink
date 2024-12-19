import React, { FC } from 'react';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';

import { Profile, ProfileControlsContext } from '../Profile';
import { ProfilesApi } from './hooks/useProfileContainers';

export type ProfilesProps = {
	profilesApi: ProfilesApi;
};

export const Profiles: FC<ProfilesProps> = ({ profilesApi }) => {
	return (
		<>
			{profilesApi.profiles.map((profileContainer) => {
				// TODO: hide not active profile, instead of unmount
				if (profilesApi.activeProfile !== profileContainer) return;

				if (profileContainer.isDisposed()) return;

				const profile = profileContainer.getContent();
				const controls = {
					profile,
					close: () => profilesApi.events.profileClosed(profileContainer),
				};

				return (
					<StatusBarProvider key={profile.profile.id}>
						<ProfileControlsContext.Provider value={controls}>
							<Profile profile={profile} controls={controls} />
						</ProfileControlsContext.Provider>
					</StatusBarProvider>
				);
			})}
		</>
	);
};
