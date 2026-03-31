import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { useErrorToast } from '@components/useErrorToast';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';

import { AppServices } from './AppServices';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileOpener } from './useProfileOpener';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { VaultEntryScreenManager } from './VaultEntryScreenManager';

export const App: FC = () => {
	const files = useFilesStorage();
	const config = useMemo(() => new ConfigStorage('config.json', files), [files]);

	const profilesList = useProfilesList();
	const profileContainers = useProfileContainers();

	const [currentProfileId, setCurrentProfileId] = useProfileSelector(config);

	// When the active vault changes, close any open error toast
	const { closeAll, show: showErrorToast } = useErrorToast();
	useEffect(() => {
		closeAll();
	}, [closeAll, currentProfileId]);

	const handleProfileOpenError = useCallback(
		(name: string) => {
			showErrorToast({
				title: 'Failed to open vault',
				description: `"${name}" appears to be corrupted.`,
			});
		},
		[showErrorToast],
	);
	const onOpenProfile = useProfileOpener(profileContainers);

	// Open recent vault
	const recentProfile = useRecentProfile(config);
	const [isProfileOpening, setIsProfileOpening] = useState(false);
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

			// Automatically open profile with no encryption
			setIsProfileOpening(true);
			onOpenProfile(profile)
				.catch(() => {
					handleProfileOpenError(profile.name);
				})
				.finally(() => setIsProfileOpening(false));
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);
	const isLoading =
		!profilesList.isProfilesLoaded || !recentProfile.isLoaded || isProfileOpening;

	const [isSplashVisible] = useDebounce(isLoading, 500);
	if (isSplashVisible) {
		return <SplashScreen />;
	}

	// Vault entry screen: login form, vault creation, or vault picker
	if (profileContainers.profiles.length === 0) {
		return (
			<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
				<Box maxW="500px" minW="350px" padding="1rem">
					<VaultEntryScreenManager
						currentProfile={currentProfileId}
						onChooseProfile={setCurrentProfileId}
						onOpenProfile={onOpenProfile}
						onOpenProfileError={handleProfileOpenError}
						profilesManager={profilesList}
					/>
				</Box>
			</Box>
		);
	}

	// Main vault screen
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
};
