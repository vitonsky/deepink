import { useCallback, useEffect, useState } from 'react';
import { ProfileObject } from '@core/storage/ProfilesManager';

import { ProfilesApi } from './Profiles/hooks/useProfileContainers';
import { ProfilesListApi } from './useProfilesList';
import { RecentProfile } from './useRecentProfile';

type PickProfileResponse = {
	status: 'ok' | 'error';
	message?: string;
};

export type OnPickProfile = (
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;

type UseProfileLoaderProps = {
	profilesList: ProfilesListApi;
	profiles: ProfilesApi;
	recentProfile: RecentProfile;
	setCurrentProfileId: (id: string | null) => void;
};

/**
 * Handles vault opening, including auto-opening unencrypted vault
 */
export const useVaultOpener = ({
	profilesList,
	profiles,
	recentProfile,
	setCurrentProfileId,
}: UseProfileLoaderProps) => {
	const [isProfileOpening, setIsProfileOpening] = useState(false);

	const onOpenProfile: OnPickProfile = useCallback(
		async (profile: ProfileObject, password?: string) => {
			setIsProfileOpening(true);

			// Profiles with no password
			if (!profile.encryption) {
				await profiles.openProfile({ profile }, true);
				setIsProfileOpening(false);
				return { status: 'ok' };
			}

			// Profiles with password
			if (password === undefined)
				return { status: 'error', message: 'Enter password' };

			try {
				await profiles.openProfile({ profile, password }, true);
				return { status: 'ok' };
			} catch (err) {
				console.error(err);

				return { status: 'error', message: 'Invalid password' };
			} finally {
				setIsProfileOpening(false);
			}
		},
		[profiles],
	);

	// Automatically open an unencrypted vault
	useEffect(
		() => {
			if (!profilesList.isProfilesLoaded || !recentProfile.isLoaded) return;

			// Restore profile id
			setCurrentProfileId(recentProfile.profileId);

			const profile = profilesList.profiles.find(
				(profile) => profile.id === recentProfile.profileId,
			);

			if (!profile || profile.encryption) {
				return;
			}

			onOpenProfile(profile);
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);

	return {
		isProfileOpening,
		onOpenProfile,
	};
};
