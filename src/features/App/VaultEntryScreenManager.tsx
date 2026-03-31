import React, { useCallback, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { SplashScreen } from '@features/SplashScreen';
import { useTelemetryTracker } from '@features/telemetry';
import { getRandomItem } from '@utils/collections/getRandomItem';

import { ProfileCreator } from './ProfileCreator';
import { ProfileLoginForm } from './ProfileLoginForm';
import { ProfilesForm } from './ProfilesForm';
import { OnPickProfile } from './useProfileOpener';
import { ProfilesListApi } from './useProfilesList';

export type VaultEntryScreenManagerProps = {
	onOpenProfile: OnPickProfile;
	profilesManager: ProfilesListApi;
	onOpenProfileError: (text: string) => void;
	currentProfile: string | null;
	onChooseProfile: (id: string | null) => void;
};

export const defaultVaultNames = [
	'Creative drafts',
	'Second brain',
	'Digital garden',
	'Creative space',
	'Mind space',
	'Idea lab',
];

/**
 * Controls which vault entry screen is shown: login form, vault creation, or vault picker
 */
export const VaultEntryScreenManager = ({
	onOpenProfile,
	onOpenProfileError,
	currentProfile,
	profilesManager,
	onChooseProfile,
}: VaultEntryScreenManagerProps) => {
	const telemetry = useTelemetryTracker();

	const [screen, setScreen] = useState<'create' | 'choose'>('choose');
	const hasNoVaults = profilesManager.profiles.length === 0;

	const [isProfileOpening, setIsProfileOpening] = useState(false);

	const openProfile = useCallback(
		(profile: ProfileObject, password?: string) => {
			setIsProfileOpening(true);
			return onOpenProfile(profile, password)
				.catch((error) => {
					setScreen('choose');
					onOpenProfileError(profile.name);
					throw error;
				})
				.finally(() => setIsProfileOpening(false));
		},
		[onOpenProfileError, onOpenProfile],
	);

	const currentVaultObject = useMemo(
		() =>
			profilesManager.profiles?.find((profile) => profile.id === currentProfile) ??
			null,
		[currentProfile, profilesManager.profiles],
	);

	// Splash screen is skipped here, login form should remain visible while the vault is opening
	if (currentVaultObject && currentVaultObject.encryption) {
		return (
			<ProfileLoginForm
				profile={currentVaultObject}
				onLogin={openProfile}
				onPickAnotherProfile={() => onChooseProfile(null)}
			/>
		);
	}

	if (isProfileOpening) return <SplashScreen />;

	if (screen === 'create' || hasNoVaults) {
		return (
			<ProfileCreator
				onCreateProfile={(profile) =>
					profilesManager
						.createProfile(profile)
						.then((newProfile) =>
							openProfile(newProfile, profile.password ?? undefined).then(
								console.warn,
							),
						)
				}
				onCancel={hasNoVaults ? undefined : () => setScreen('choose')}
				defaultProfileName={
					hasNoVaults ? getRandomItem(defaultVaultNames) : undefined
				}
			/>
		);
	}

	return (
		<ProfilesForm
			title="Choose the profile"
			controls={
				<>
					<Button
						variant="accent"
						size="lg"
						w="100%"
						onClick={() => setScreen('create')}
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
				items={(profilesManager.profiles ?? []).map((profile) => ({
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
								onChooseProfile(profile.id);

								if (profile.encryption === null) {
									openProfile(profile);
								}

								telemetry.track(TELEMETRY_EVENT_NAME.PROFILE_SELECTED);
							}}
						>
							<FaUser />
							<Text>{profile.name}</Text>
						</HStack>
					),
				}))}
			/>
		</ProfilesForm>
	);
};
