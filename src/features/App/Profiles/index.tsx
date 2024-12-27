import React, { FC } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

import { Profile, ProfileControlsContext } from '../Profile';
import { ProfilesApi } from './hooks/useProfileContainers';

export type ProfilesProps = {
	profilesApi: ProfilesApi;
};

export const Profiles: FC<ProfilesProps> = ({ profilesApi }) => {
	const dispatch = useAppDispatch();
	return (
		<>
			{profilesApi.profiles.map((profileContainer) => {
				// TODO: hide not active profile, instead of unmount
				if (profilesApi.activeProfile !== profileContainer) return;

				if (profileContainer.isDisposed()) return;

				const profile = profileContainer.getContent();
				const controls = {
					profile,
					close: () => {
						profilesApi.events.profileClosed(profileContainer);

						dispatch(
							workspacesApi.removeProfile({
								profileId: profile.profile.id,
							}),
						);
					},
				};

				return (
					<ProfileControlsContext.Provider value={controls}>
						<Profile profile={profile} controls={controls} />
					</ProfileControlsContext.Provider>
				);
			})}
		</>
	);
};
