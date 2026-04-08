import React, { FC, useEffect, useMemo } from 'react';
import { VaultStorage } from '@features/files';
import { useAppDispatch } from '@state/redux/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';
import { DisposableBox } from '@utils/disposable';

import { Profile, ProfileControls, ProfileControlsContext } from '../Profile';
import { VaultErrorProvider } from '../Profile/VaultErrorProvider';
import { ProfileContainer, ProfilesApi } from './hooks/useProfileContainers';

export type ProfilesProps = {
	profilesApi: ProfilesApi;
};

const VaultProviders = ({
	profileContainer,
	profilesApi,
}: {
	profileContainer: DisposableBox<ProfileContainer>;
	profilesApi: ProfilesApi;
}) => {
	const dispatch = useAppDispatch();

	const vault = profileContainer.getContent();
	const controls = useMemo(() => {
		return {
			profile: vault,
			close: () => {
				profilesApi.events.profileClosed(profileContainer);

				dispatch(
					workspacesApi.removeProfile({
						profileId: vault.profile.id,
					}),
				);
			},
		} satisfies ProfileControls;
	}, [dispatch, vault, profileContainer, profilesApi.events]);

	// Close the vault on unmount and clean up all resources
	useEffect(() => {
		return () => controls.close();
	}, [controls]);

	return (
		<ProfileControlsContext.Provider value={controls}>
			<VaultErrorProvider controls={controls}>
				<VaultStorage value={vault.files}>
					<Profile profile={vault} controls={controls} />
				</VaultStorage>
			</VaultErrorProvider>
		</ProfileControlsContext.Provider>
	);
};

export const Profiles: FC<ProfilesProps> = ({ profilesApi }) => {
	return (
		<>
			{profilesApi.profiles.map((profileContainer) => {
				// TODO: hide not active profile, instead of unmount
				if (profilesApi.activeProfile !== profileContainer) return;

				if (profileContainer.isDisposed()) return;

				const profile = profileContainer.getContent();

				return (
					<VaultProviders
						key={profile.profile.id}
						profileContainer={profileContainer}
						profilesApi={profilesApi}
					/>
				);
			})}
		</>
	);
};
