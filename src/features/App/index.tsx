import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { useDebounce } from 'use-debounce';
import { Box, Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { useToastNotification } from '@components/useToastNotification';
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

	const [currentProfileId, setCurrentProfileId] = useProfileSelector(config);
	const currentProfileObject = useMemo(
		() =>
			profilesList.profiles?.find((profile) => profile.id === currentProfileId) ??
			null,
		[currentProfileId, profilesList.profiles],
	);

	// When the active vault changes, close any open error toast
	const { closeAll, show: showErrorToast } = useToastNotification();
	useEffect(() => {
		closeAll();
	}, [closeAll, currentProfileId]);

	const openProfile = useOpenProfile(profileContainers);

	const [screen, setScreen] = useState<'create' | 'choose'>('choose');
	const [isProfileOpening, setIsProfileOpening] = useState(false);
	const handleOpenProfile = useCallback(
		async (profile: ProfileObject, password?: string) => {
			setIsProfileOpening(true);
			try {
				return await openProfile(profile, password);
			} catch (error) {
				setScreen('choose');
				showErrorToast({
					title: 'Failed to open vault',
					description: `"${profile.name}" appears to be corrupted.`,
				});

				throw error;
			} finally {
				setIsProfileOpening(false);
			}
		},
		[openProfile, showErrorToast],
	);

	// Restore and auto-open recent profile
	const recentProfile = useRecentProfile(config);
	const [isProfileAutoOpening, setIsProfileAutoOpening] = useState(false);
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
			setIsProfileAutoOpening(true);
			openProfile(profile)
				.catch(() =>
					showErrorToast({
						title: 'Failed to open vault',
						description: `"${profile.name}" appears to be corrupted.`,
					}),
				)
				.finally(() => setIsProfileAutoOpening(false));
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);

	// Show splash screen until app is ready to render
	const isLoading =
		!profilesList.isProfilesLoaded || !recentProfile.isLoaded || isProfileAutoOpening;
	const [isSplashVisible] = useDebounce(isLoading, 500);
	if (isSplashVisible) return <SplashScreen />;

	// Main vault screen
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

	const hasNoVaults = profilesList.profiles.length === 0;

	// Login form stays visible while vault is opening — splash is skipped
	if (currentProfileObject && currentProfileObject.encryption) {
		return (
			<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
				<Box maxW="500px" minW="350px" padding="1rem">
					<ProfileLoginForm
						profile={currentProfileObject}
						onLogin={handleOpenProfile}
						onPickAnotherProfile={() => setCurrentProfileId(null)}
					/>
				</Box>
			</Box>
		);
	}

	if (isProfileOpening) return <SplashScreen />;

	if (screen === 'create' || hasNoVaults) {
		return (
			<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
				<Box maxW="500px" minW="350px" padding="1rem">
					<ProfileCreator
						onCreateProfile={(profile) =>
							profilesList
								.createProfile(profile)
								.then((newProfile) =>
									openProfile(
										newProfile,
										profile.password ?? undefined,
									).then(console.warn),
								)
						}
						onCancel={hasNoVaults ? undefined : () => setScreen('choose')}
						defaultProfileName={
							hasNoVaults ? getRandomItem(defaultVaultNames) : undefined
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
							onClick={() => setScreen('create')}
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
										setCurrentProfileId(profile.id);

										if (profile.encryption === null) {
											handleOpenProfile(profile);
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
