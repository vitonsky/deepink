import React, { createContext, FC } from 'react';
import { Profile } from '@features/Profile';
import { ProfilesApi } from '@state/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const ProfilesContext = createContext<ProfilesApi | null>(null);
export const useProfilesContext = createContextGetterHook(ProfilesContext);
export type ProfilesProps = {
	profilesApi: ProfilesApi;
};

export const Profiles: FC<ProfilesProps> = ({ profilesApi }) => {
	return (
		<ProfilesContext.Provider value={profilesApi}>
			{profilesApi.profiles.map((profileContainer) => {
				// TODO: hide not active profile, instead of unmount
				if (profilesApi.activeProfile !== profileContainer) return;

				if (profileContainer.isDisposed()) return;

				const profile = profileContainer.getContent();
				return (
					<Profile
						profile={profile}
						key={profile.profile.id}
						controls={{
							close: () =>
								profilesApi.events.profileClosed(profileContainer),
						}}
					/>
				);
			})}
		</ProfilesContext.Provider>
	);
};
