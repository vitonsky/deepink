import React, { FC, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';
import { useDelayedFalse } from '@hooks/useDelayedFalse';

import { AppServices } from './AppServices';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { useVaultOpener } from './useVaultOpener';
import { VaultScreenManager } from './VaultScreenManager';

export const App: FC = () => {
	const files = useFilesStorage();
	const config = useMemo(() => new ConfigStorage('config.json', files), [files]);

	const profilesList = useProfilesList();
	const profileContainers = useProfileContainers();

	const [currentProfileId, setCurrentProfileId] = useProfileSelector(config);

	// Open recent profile
	const recentProfile = useRecentProfile(config);
	const { isProfileOpening, onOpenProfile } = useVaultOpener({
		profilesList,
		recentProfile,
		setCurrentProfileId,
		profiles: profileContainers,
	});

	const isLoading =
		!profilesList.isProfilesLoaded || !recentProfile.isLoaded || isProfileOpening;

	// Show Splash immediately, but delay hiding it
	const isSplashVisible = useDelayedFalse(isLoading);
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
				<VaultScreenManager
					currentProfile={currentProfileId}
					onChooseProfile={setCurrentProfileId}
					profiles={profilesList}
					onOpenProfile={onOpenProfile}
				/>
			</Box>
		</Box>
	);
};
