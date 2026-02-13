import { useCallback, useEffect, useState } from 'react';
import { ProfileObject } from '@core/storage/ProfilesManager';

import { ProfilesApi } from './Profiles/hooks/useProfileContainers';
import { ProfilesListApi } from './useProfilesList';
import { OnPickProfile } from './WorkspaceManager';

export type UseProfileLoaderProps = {
	profilesList: ProfilesListApi;
	profiles: ProfilesApi;
	recentProfile: {
		isLoaded: boolean;
		profileId: string | null;
	};
	setCurrentProfileId: (id: string | null) => void;
};

export const useProfileLoader = ({
	profilesList,
	profiles,
	recentProfile,
	setCurrentProfileId,
}: UseProfileLoaderProps) => {
	const [isOpening, setIsOpening] = useState(true);

	const onOpenProfile: OnPickProfile = useCallback(
		async (profile: ProfileObject, password?: string) => {
			// Profiles with no password
			if (!profile.encryption) {
				setIsOpening(true);
				await profiles.openProfile({ profile }, true);
				setIsOpening(false);
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
				setIsOpening(false);
			}
		},
		[profiles],
	);

	// Open recent profile
	useEffect(
		() => {
			if (!profilesList.isProfilesLoaded || !recentProfile.isLoaded) return;

			// Restore profile id
			setCurrentProfileId(recentProfile.profileId);

			const profile = profilesList.profiles.find(
				(profile) => profile.id === recentProfile.profileId,
			);

			if (!profile || profile.encryption) {
				setIsOpening(false);
				return;
			}

			onOpenProfile(profile);
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);

	return {
		isOpening,
		onOpenProfile,
	};
};
