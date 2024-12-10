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
					close: () => profilesApi.events.profileClosed(profileContainer),
				};

				return (
					<StatusBarProvider>
						<ProfileControlsContext.Provider value={controls}>
							<Profile
								profile={profile}
								key={profile.profile.id}
								controls={controls}
							/>
						</ProfileControlsContext.Provider>
					</StatusBarProvider>
				);
			})}
		</>
	);
};
