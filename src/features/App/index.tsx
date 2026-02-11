import React, { FC, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Box, Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ElectronFilesController, storageApi } from '@electron/requests/storage/renderer';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { SplashScreen } from '@features/SplashScreen';

import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { SettingsWindow } from './Settings/SettingsWindow';
import { useAppUpdater } from './useAppUpdater';
import { useAutoOpenProfile } from './useAutoOpenProfile';
import { useOpenProfile } from './useOpenProfile';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { ProfileCreator } from './WorkspaceManager/ProfileCreator';
import { ProfileLoginForm } from './WorkspaceManager/ProfileLoginForm';
import { ProfilesForm } from './WorkspaceManager/ProfilesForm';

export const App: FC = () => {
	useAppUpdater();

	const [config] = useState(
		() =>
			new ConfigStorage(
				'config.json',
				new ElectronFilesController(storageApi, '/'),
			),
	);

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
	const isProfileOpening = useAutoOpenProfile({
		profilesList,
		recentProfile,
		setCurrentProfileId: setCurrentProfileId,
		profiles: profileContainers,
	});

	const onOpenProfile = useOpenProfile(profileContainers);

	const [authScreen, setAuthScreen] = useState<'choose' | 'create' | 'login'>('choose');

	const screenName: 'loading' | 'main' | 'auth' = useMemo(() => {
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

		return 'auth';
	}, [
		profilesList.isProfilesLoaded,
		recentProfile.isLoaded,
		isProfileOpening,
		profileContainers.profiles.length,
	]);

	if (screenName === 'loading') return <SplashScreen />;

	if (screenName == 'main') {
		return (
			<Box
				sx={{
					display: 'flex',
					width: '100%',
					height: '100vh',
				}}
			>
				<Profiles profilesApi={profileContainers} />
				<SettingsWindow />
			</Box>
		);
	}

	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				{authScreen === 'create' && (
					<ProfileCreator
						onCreateProfile={(profile) =>
							profilesList.createProfile(profile).then((newProfile) => {
								// setScreenName('main');
								onOpenProfile(
									newProfile,
									profile.password ?? undefined,
								).then(console.warn);
							})
						}
						onCancel={() => setAuthScreen('choose')}
					/>
				)}

				{currentProfileObject && (
					<ProfileLoginForm
						profile={currentProfileObject}
						onLogin={onOpenProfile}
						onPickAnotherProfile={() => {
							setCurrentProfileId(null);
						}}
					/>
				)}

				{authScreen !== 'create' && !currentProfileId && (
					<ProfilesForm
						title="Choose the profile"
						controls={
							<>
								<Button
									variant="accent"
									size="lg"
									w="100%"
									onClick={() => setAuthScreen('create')}
								>
									Create new profile
								</Button>
							</>
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
										sx={{
											padding: '.8rem 1rem',
											w: '100%',
											cursor: 'pointer',
											gap: '.8rem',
										}}
										key={profile.id}
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
