import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { useDebounce } from 'use-debounce';
import { Box, Button, Divider, HStack, Text, useToast } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';
import { getRandomItem } from '@utils/collections/getRandomItem';

import { AppServices } from './AppServices';
import { ProfileCreator } from './ProfileCreator';
import { ProfileLoginForm } from './ProfileLoginForm';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { ProfilesForm } from './ProfilesForm';
import { useOpenProfile } from './useOpenProfile';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';

export const defaultVaultNames = [
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
	const openProfile = useOpenProfile(profileContainers);
	const recentProfile = useRecentProfile(config);

	const [currentVaultId, setCurrentVaultId] = useProfileSelector(config);
	const [isVaultOpening, setIsVaultOpening] = useState(false);
	const [screenName, setScreenName] = useState<'createVault' | 'chooseVault'>(
		'chooseVault',
	);

	const currentVault = useMemo(
		() => profilesList.profiles.find((p) => p.id === currentVaultId) ?? null,
		[currentVaultId, profilesList.profiles],
	);

	const toast = useToast();
	const showErrorToast = useCallback(
		(name: string) => {
			toast({
				status: 'error',
				title: 'Failed to open vault',
				description: `"${name}" appears to be corrupted.`,
				containerStyle: { maxW: '400px' },
			});
		},
		[toast],
	);

	const onOpenVault = useCallback(
		async (profile: ProfileObject, password?: string) => {
			setIsVaultOpening(true);
			try {
				return await openProfile(profile, password);
			} catch (error) {
				showErrorToast(profile.name);
				throw error;
			} finally {
				setIsVaultOpening(false);
				setScreenName('chooseVault');
			}
		},
		[openProfile, showErrorToast],
	);

	// When the active vault changes, close any open error toast
	useEffect(() => {
		toast.closeAll();
	}, [currentVaultId, toast]);

	// Restore and auto-open recent profile
	const [isProfileAutoOpening, setIsProfileAutoOpening] = useState(false);
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
			setIsProfileAutoOpening(true);
			openProfile(profile)
				.catch(() => showErrorToast(profile.name))
				.finally(() => setIsProfileAutoOpening(false));
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);

	// Show splash screen while app is loading
	const isAppLoading =
		!profilesList.isProfilesLoaded || !recentProfile.isLoaded || isProfileAutoOpening;
	const [isSplashVisible] = useDebounce(isAppLoading, 500);
	if (isSplashVisible) return <SplashScreen />;

	// Main vault screen
	if (profileContainers.activeProfile && !isVaultOpening) {
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

	// Login form stays visible while vault is opening — splash is skipped
	if (currentVault?.encryption) {
		return (
			<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
				<Box maxW="500px" minW="350px" padding="1rem">
					<ProfileLoginForm
						profile={currentVault}
						onLogin={onOpenVault}
						onPickAnotherProfile={() => setCurrentVaultId(null)}
					/>
				</Box>
			</Box>
		);
	}

	// Show splash while profile is opening
	if (isVaultOpening) return <SplashScreen />;

	const hasNoProfiles = profilesList.profiles.length === 0;
	if (screenName === 'createVault' || hasNoProfiles) {
		return (
			<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
				<Box maxW="500px" minW="350px" padding="1rem">
					<ProfileCreator
						onCreateProfile={async (profile) => {
							const newProfile = await profilesList.createProfile(profile);
							await onOpenVault(newProfile, profile.password || undefined);
						}}
						onCancel={
							hasNoProfiles ? undefined : () => setScreenName('chooseVault')
						}
						defaultProfileName={
							hasNoProfiles ? getRandomItem(defaultVaultNames) : undefined
						}
					/>
				</Box>
			</Box>
		);
	}

	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				<ProfilesForm
					title="Choose the profile"
					controls={
						<Button
							variant="accent"
							size="lg"
							w="100%"
							onClick={() => setScreenName('createVault')}
						>
							Create new profile
						</Button>
					}
				>
					<NestedList
						divider={<Divider margin="0px !important" />}
						sx={{
							w: '100%',
							borderRadius: '4px',
							maxHeight: '230px',
							overflow: 'auto',
							border: '1px solid',
						}}
						items={(profilesList.profiles ?? []).map((profile) => ({
							id: profile.id,
							content: (
								<HStack
									as="button"
									key={profile.id}
									sx={{
										padding: '.8rem 1rem',
										w: '100%',
										cursor: 'pointer',
										gap: '.8rem',
									}}
									onClick={() => {
										setCurrentVaultId(profile.id);

										if (profile.encryption === null) {
											onOpenVault(profile);
										}

										telemetry.track(
											TELEMETRY_EVENT_NAME.PROFILE_SELECTED,
										);
									}}
								>
									<FaUser />
									<Text>{profile.name}</Text>
								</HStack>
							),
						}))}
					/>
				</ProfilesForm>
			</Box>
		</Box>
	);
};
