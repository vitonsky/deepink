import React, { useCallback, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { SplashScreen } from '@features/SplashScreen';
import { getRandomItem } from '@utils/collections/getRandomItem';

import { ProfileCreator } from './ProfileCreator';
import { ProfileLoginForm } from './ProfileLoginForm';
import { ProfilesApi } from './Profiles/hooks/useProfileContainers';
import { ProfilesForm } from './ProfilesForm';
import { ProfilesListApi } from './useProfilesList';

type PickProfileResponse = {
	status: 'ok' | 'error';
	message?: string;
};

export type OnPickProfile = (
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;

export type VaultEntryScreensProps = {
	profiles: ProfilesApi;
	profilesManager: ProfilesListApi;
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
	currentProfile,
	profiles,
	profilesManager,
	onChooseProfile,
}: VaultEntryScreensProps) => {
	const [isVaultOpening, setIsVaultOpening] = useState(false);

	const onOpenVault: OnPickProfile = useCallback(
		async (profile: ProfileObject, password?: string) => {
			setIsVaultOpening(true);

			try {
				// Profiles with no password
				if (!profile.encryption) {
					await profiles.openProfile({ profile }, true);
					return { status: 'ok' };
				}

				// Profiles with password
				try {
					if (password === undefined)
						return { status: 'error', message: 'Enter password' };

					await profiles.openProfile({ profile, password }, true);

					return { status: 'ok' };
				} catch (err) {
					console.error(err);

					return { status: 'error', message: 'Invalid password' };
				}
			} finally {
				setIsVaultOpening(false);
			}
		},
		[profiles],
	);

	const currentVaultObject = useMemo(
		() =>
			profilesManager.profiles?.find((profile) => profile.id === currentProfile) ??
			null,
		[currentProfile, profilesManager.profiles],
	);

	const [screen, setScreen] = useState<'create' | 'choose'>('choose');
	const hasNoVaults = profilesManager.profiles.length === 0;

	// SplashScreen is skipped here, ProfileLoginForm should remain visible while the vault is opening
	if (currentVaultObject && currentVaultObject.encryption) {
		return (
			<ProfileLoginForm
				profile={currentVaultObject}
				onLogin={onOpenVault}
				onPickAnotherProfile={() => onChooseProfile(null)}
			/>
		);
	}

	if (isVaultOpening) return <SplashScreen />;

	if (screen === 'create' || hasNoVaults) {
		return (
			<ProfileCreator
				onCreateProfile={(profile) =>
					profilesManager.createProfile(profile).then((newProfile) => {
						onOpenVault(newProfile, profile.password ?? undefined).then(
							console.warn,
						);
					})
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
									onOpenVault(profile);
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
