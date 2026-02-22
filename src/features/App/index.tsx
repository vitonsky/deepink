import React, { FC, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Box, Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';
import { getRandomItem } from '@utils/collections/getRandomItem';

import { AppServices } from './AppServices';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileLoader } from './useProfileLoader';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { ProfileCreator } from './WorkspaceManager/ProfileCreator';
import { ProfileLoginForm } from './WorkspaceManager/ProfileLoginForm';
import { ProfilesForm } from './WorkspaceManager/ProfilesForm';

const defaultProfileNames = [
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

	// Open recent profile
	const recentProfile = useRecentProfile(config);
	const { isOpening: isProfileOpening, onOpenProfile } = useProfileLoader({
		profilesList,
		recentProfile,
		setCurrentProfileId: setCurrentProfileId,
		profiles: profileContainers,
	});

	const [vaultView, setVaultView] = useState<'createVault' | 'chooseVault'>(
		'chooseVault',
	);
	const currentScreen: 'loading' | 'main' | 'vaultManager' = useMemo(() => {
		if (
			!profilesList.isProfilesLoaded ||
			!recentProfile.isLoaded ||
			isProfileOpening
		) {
			return 'loading';
		}

		if (profileContainers.profiles.length > 0) {
			return 'main';
		}

		return 'vaultManager';
	}, [
		isProfileOpening,
		profileContainers.profiles.length,
		profilesList.isProfilesLoaded,
		recentProfile.isLoaded,
	]);

	if (currentScreen === 'loading') {
		return <SplashScreen />;
	}

	if (currentScreen === 'main') {
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

	const hasNoProfiles = profilesList.profiles.length === 0;
	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				{currentProfileObject && (
					<ProfileLoginForm
						profile={currentProfileObject}
						onLogin={onOpenProfile}
						onPickAnotherProfile={() => setCurrentProfileId(null)}
					/>
				)}

				{(vaultView === 'createVault' || hasNoProfiles) && (
					<ProfileCreator
						onCreateProfile={(profile) =>
							profilesList.createProfile(profile).then((newProfile) => {
								onOpenProfile(
									newProfile,
									profile.password ?? undefined,
								).then(console.warn);
							})
						}
						onCancel={
							hasNoProfiles ? undefined : () => setVaultView('chooseVault')
						}
						defaultProfileName={
							hasNoProfiles ? getRandomItem(defaultProfileNames) : undefined
						}
					/>
				)}

				{vaultView === 'chooseVault' &&
					!currentProfileObject &&
					!hasNoProfiles && (
						<ProfilesForm
							title="Choose the profile"
							controls={
								<Button
									variant="accent"
									size="lg"
									w="100%"
									onClick={() => setVaultView('createVault')}
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
								items={profilesList.profiles.map((profile) => ({
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
													onOpenProfile(profile);
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
					)}
			</Box>
		</Box>
	);
};
