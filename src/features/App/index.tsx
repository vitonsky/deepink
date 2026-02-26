import React, { FC, useEffect, useMemo, useState } from 'react';
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
import { ProfileCreator } from './Profile/ProfileCreator';
import { ProfileLoginForm } from './Profile/ProfileLoginForm';
import { ProfilesForm } from './Profile/ProfilesForm';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileLoader } from './useProfileLoader';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';

const defaultVaultNames = [
	'Creative drafts',
	'Second brain',
	'Digital garden',
	'Creative space',
	'Mind space',
	'Idea lab',
];

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
	const currentProfileObject = useMemo(
		() =>
			profilesList.profiles?.find((profile) => profile.id === currentProfileId) ??
			null,
		[currentProfileId, profilesList.profiles],
	);

	// Open recent profile
	const recentProfile = useRecentProfile(config);
	const { isProfileOpening, onOpenProfile } = useProfileLoader({
		profilesList,
		recentProfile,
		setCurrentProfileId,
		profiles: profileContainers,
	});

	const [vaultManagerScreen, setVaultManagerScreen] = useState<'create' | 'choose'>(
		'choose',
	);

	const [openMode, setOpenMode] = useState<'auto' | 'manual'>('auto');
	const isLoading =
		!profilesList.isProfilesLoaded ||
		!recentProfile.isLoaded ||
		(isProfileOpening && openMode === 'auto');

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

	// Managing vault screens
	const hasNoProfiles = profilesList.profiles.length === 0;
	const screen = currentProfileObject
		? 'login'
		: vaultManagerScreen === 'create' || hasNoProfiles
			? 'create'
			: 'choose';
	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				{screen === 'login' && currentProfileObject && (
					<ProfileLoginForm
						profile={currentProfileObject}
						onLogin={async (...arg) => {
							setOpenMode('manual');
							return await onOpenProfile(...arg);
						}}
						onPickAnotherProfile={() => setCurrentProfileId(null)}
					/>
				)}

				{screen === 'create' && (
					<ProfileCreator
						onCreateProfile={(profile) =>
							profilesList.createProfile(profile).then((newProfile) => {
								onOpenProfile(
									newProfile,
									profile.password ?? undefined,
								).then(console.warn);
								setVaultManagerScreen('choose');
							})
						}
						onCancel={
							hasNoProfiles
								? undefined
								: () => setVaultManagerScreen('choose')
						}
						defaultProfileName={
							hasNoProfiles ? getRandomItem(defaultVaultNames) : undefined
						}
					/>
				)}

				{screen === 'choose' && (
					<ProfilesForm
						title="Choose the profile"
						controls={
							<Button
								variant="accent"
								size="lg"
								w="100%"
								onClick={() => setVaultManagerScreen('create')}
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
