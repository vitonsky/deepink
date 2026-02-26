import React, { FC, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';

import { AppServices } from './AppServices';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileLoader } from './useProfileLoader';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { VaultScreenManager } from './VaultScreenManager';

export const App: FC = () => {
	const files = useFilesStorage();
	const config = useMemo(() => new ConfigStorage('config.json', files), [files]);

	const profilesList = useProfilesList();
	const profileContainers = useProfileContainers();

	const [currentProfileId, setCurrentProfileId] = useProfileSelector(config);

	// Open recent profile
	const recentProfile = useRecentProfile(config);
	const { isProfileOpening, onOpenProfile } = useProfileLoader({
		profilesList,
		recentProfile,
		setCurrentProfileId,
		profiles: profileContainers,
	});

	const [isAutoLoading, setIsAutoLoading] = useState(true);
	const isLoading =
		!profilesList.isProfilesLoaded ||
		!recentProfile.isLoaded ||
		(isProfileOpening && isAutoLoading);

	// Show Splash immediately, but delay hiding it
	const [isShowSplash, setIsShowSplash] = useState(isLoading);
	useEffect(() => {
		if (isLoading) {
			setIsShowSplash(true);
			return;
		}

		const timer = setTimeout(() => setIsShowSplash(false), 400);
		return () => clearTimeout(timer);
	}, [isLoading]);

	if (isShowSplash) {
		return <SplashScreen />;
	}

	// Vault screen
	if (profileContainers.profiles.length > 0) {
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
					onLoginStart={() => setIsAutoLoading(false)}
				/>
			</Box>
		</Box>
	);
};
