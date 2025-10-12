import React, { FC } from 'react';
import { LexemesRegistry } from '@core/features/notes/controller/LexemesRegistry';
import { CommandEventProvider } from '@hooks/commands/CommandEventProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

import { Profile, ProfileControls, ProfileControlsContext } from '../Profile';
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
					api: {
						lexemes: new LexemesRegistry(profile.db),
					},
					close: () => {
						profilesApi.events.profileClosed(profileContainer);

						dispatch(
							workspacesApi.removeProfile({
								profileId: profile.profile.id,
							}),
						);
					},
				} satisfies ProfileControls;

				return (
					<ProfileControlsContext.Provider
						value={controls}
						key={profile.profile.id}
					>
						<CommandEventProvider>
							<Profile profile={profile} controls={controls} />
						</CommandEventProvider>
					</ProfileControlsContext.Provider>
				);
			})}
		</>
	);
};
