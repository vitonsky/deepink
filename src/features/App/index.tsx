import React, { FC, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';

import { AppServices } from './AppServices';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { VaultEntryScreens } from './VaultEntryScreens';

export const App: FC = () => {
	const files = useFilesStorage();
	const config = useMemo(() => new ConfigStorage('config.json', files), [files]);

	const profilesList = useProfilesList();
	const profileContainers = useProfileContainers();

	const [currentProfileId, setCurrentProfileId] = useProfileSelector(config);

	// Automatically open an unencrypted vault
	const recentVault = useRecentProfile(config);
	const [isOpeningRecentVault, setIsOpeningRecentVault] = useState(false);
	useEffect(
		() => {
			if (!profilesList.isProfilesLoaded || !recentVault.isLoaded) return;

			// Restore profile id
			setCurrentProfileId(recentVault.profileId);

			const vault = profilesList.profiles.find(
				(profile) => profile.id === recentVault.profileId,
			);

			// open only unencrypted vault
			if (vault && !vault.encryption) {
				setIsOpeningRecentVault(true);

				profileContainers
					.openProfile({ profile: vault })
					.then(() => setIsOpeningRecentVault(false));
			}
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentVault.isLoaded],
	);

	const isLoading =
		!profilesList.isProfilesLoaded || !recentVault.isLoaded || isOpeningRecentVault;

	const [isSplashVisible] = useDebounce(isLoading, 500);
	if (isSplashVisible) {
		return <SplashScreen />;
	}

	// Vault screen
	if (profileContainers.profiles.length > 0 && profileContainers.activeProfile) {
		return (
			<Box
				sx={{
					display: 'flex',
					width: '100%',
					height: '100vh',
				}}
			>
				<Profiles profilesApi={profileContainers} />
				<AppServices />
			</Box>
		);
	}

	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				<VaultEntryScreens
					currentProfile={currentProfileId}
					onChooseProfile={setCurrentProfileId}
					profiles={profileContainers}
					profilesManager={profilesList}
				/>
			</Box>
		</Box>
	);
};
