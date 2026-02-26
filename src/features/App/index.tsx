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

/**
 * Immediately returns true, but waits delay time before switching to false
 */
const useMinimumVisible = (isLoading: boolean, delay: number) => {
	const [visible, setVisible] = useState(isLoading);

	useEffect(() => {
		if (isLoading) {
			setVisible(true);
			return;
		}

		const timer = setTimeout(() => setVisible(false), delay);
		return () => clearTimeout(timer);
	}, [isLoading, delay]);

	return visible;
};

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

	const [isManualOpen, setIsManualOpen] = useState(false);
	const isLoading =
		!profilesList.isProfilesLoaded ||
		!recentProfile.isLoaded ||
		(isProfileOpening && !isManualOpen);

	const isShowSplash = useMinimumVisible(isLoading, 400);
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
					profiles={profilesList}
					onOpenProfile={onOpenProfile}
					onChooseProfile={setCurrentProfileId}
					setIsManualOpen={() => setIsManualOpen(true)}
				/>
			</Box>
		</Box>
	);
};
