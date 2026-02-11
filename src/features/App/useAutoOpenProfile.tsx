import { useEffect, useState } from 'react';

import { ProfilesApi } from './Profiles/hooks/useProfileContainers';
import { ProfilesListApi } from './useProfilesList';

export type UseAutoOpenProfileProps = {
	profilesList: ProfilesListApi;
	profiles: ProfilesApi;
	recentProfile: {
		isLoaded: boolean;
		profileId: string | null;
	};
	setCurrentProfileId: (id: string | null) => void;
};

export const useAutoOpenProfile = ({
	profilesList,
	profiles,
	recentProfile,
	setCurrentProfileId,
}: UseAutoOpenProfileProps) => {
	const [isAutoOpening, setIsAutoOpening] = useState(true);

	useEffect(
		() => {
			if (!profilesList.isProfilesLoaded || !recentProfile.isLoaded) return;

			// Restore profile id
			setCurrentProfileId(recentProfile.profileId);

			const profile = profilesList.profiles.find(
				(profile) => profile.id === recentProfile.profileId,
			);
			if (!profile || profile.encryption) {
				setIsAutoOpening(false);
				return;
			}

			profiles.openProfile({ profile }, true).then(() => {
				setIsAutoOpening(false);
			});
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);

	return isAutoOpening;
};
