import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Box, Center, useToast } from '@chakra-ui/react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';
import { getRandomItem } from '@utils/collections/getRandomItem';

import { AppServices } from './AppServices';
import { ChooseVaultScreen } from './ChooseVaultScreen';
import { ProfileCreator } from './ProfileCreator';
import { ProfileLoginForm } from './ProfileLoginForm';
import { Profiles } from './Profiles';
import {
	useProfileContainers,
	VaultOpenError,
	VaultOpenErrorCode,
} from './Profiles/hooks/useProfileContainers';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';

type PickProfileResponse = { status: 'ok' } | { status: 'error'; message: string };

export type OnPickProfile = (
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;

const defaultVaultNames = [
	'Creative drafts',
	'Second brain',
	'Digital garden',
	'Creative space',
	'Mind space',
	'Idea lab',
];

export const App: FC = () => {
	const files = useFilesStorage();
	const config = useMemo(() => new ConfigStorage('config.json', files), [files]);

	const profilesList = useProfilesList();
	const profileContainers = useProfileContainers();

	const [currentVaultId, setCurrentVaultId] = useProfileSelector(config);
	const currentVault = useMemo(
		() => profilesList.profiles.find((p) => p.id === currentVaultId) ?? null,
		[currentVaultId, profilesList.profiles],
	);

	// When the active vault changes, close any open error toast
	const toast = useToast();
	useEffect(() => {
		toast.closeAll();
	}, [currentVaultId, toast]);

	const [screenName, setScreenName] = useState<'create' | 'choose' | 'loading'>(
		'choose',
	);
	const onOpenVault = useCallback(
		async (
			profile: ProfileObject,
			password?: string,
		): Promise<PickProfileResponse> => {
			setScreenName('loading');

			try {
				if (profile.encryption !== null && password === undefined) {
					return { status: 'error', message: 'Enter password' };
				}

				await profileContainers.openProfile({ profile, password }, true);
				return { status: 'ok' };
			} catch (err) {
				// Only unexpected errors show a toast — wrong password is handled by the form
				if (
					err instanceof VaultOpenError &&
					err.code === VaultOpenErrorCode.INCORRECT_PASSWORD
				) {
					return { status: 'error', message: 'Invalid password' };
				}

				toast({
					status: 'error',
					title: 'Failed to open vault',
					description: `"${profile.name}" appears to be corrupted.`,
					containerStyle: { maxW: '400px' },
				});

				throw err;
			} finally {
				setScreenName('choose');
			}
		},
		[profileContainers, toast],
	);

	// Restore and auto-open recent profile
	const recentProfile = useRecentProfile(config);
	useEffect(
		() => {
			if (!profilesList.isProfilesLoaded || !recentProfile.isLoaded) return;

			// Restore profile id
			setCurrentVaultId(recentProfile.profileId);

			const profile = profilesList.profiles.find(
				(profile) => profile.id === recentProfile.profileId,
			);

			if (!profile || profile.encryption) return;

			// Automatically open profile with no encryption
			onOpenVault(profile);
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);

	const [isInitialLoading] = useDebounce(
		!profilesList.isProfilesLoaded || !recentProfile.isLoaded,
		500,
	);

	// Skip splash while encrypted vault is opening
	const isVaultLoading = screenName === 'loading' && !currentVault?.encryption;
	if (isInitialLoading || isVaultLoading) return <SplashScreen />;

	// Main vault screen
	if (profileContainers.activeProfile && screenName !== 'loading') {
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

	if (currentVault && currentVault.encryption) {
		return (
			<Center h="100vh">
				<Box maxW="500px" minW="350px">
					<ProfileLoginForm
						profile={currentVault}
						onLogin={onOpenVault}
						onPickAnotherProfile={() => setCurrentVaultId(null)}
					/>
				</Box>
			</Center>
		);
	}

	const hasNoProfiles = profilesList.profiles.length === 0;
	if (screenName === 'create' || hasNoProfiles) {
		return (
			<Center h="100vh">
				<Box maxW="500px" minW="350px">
					<ProfileCreator
						onCreateProfile={async (profile) => {
							const newProfile = await profilesList.createProfile(profile);
							await onOpenVault(newProfile, profile.password || undefined);
						}}
						onCancel={
							hasNoProfiles ? undefined : () => setScreenName('choose')
						}
						defaultProfileName={
							hasNoProfiles ? getRandomItem(defaultVaultNames) : undefined
						}
					/>
				</Box>
			</Center>
		);
	}

	return (
		<Center h="100vh">
			<Box maxW="500px" minW="350px">
				<ChooseVaultScreen
					vaults={profilesList.profiles}
					onOpenVault={onOpenVault}
					onCreateVault={() => setScreenName('create')}
				/>
			</Box>
		</Center>
	);
};
