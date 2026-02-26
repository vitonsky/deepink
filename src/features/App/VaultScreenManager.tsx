import React, { useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { getRandomItem } from '@utils/collections/getRandomItem';

import { ProfileCreator } from './Profile/ProfileCreator';
import { ProfileLoginForm } from './Profile/ProfileLoginForm';
import { ProfilesForm } from './Profile/ProfilesForm';
import { OnPickProfile } from './useProfileLoader';
import { ProfilesListApi } from './useProfilesList';

export type VaultScreenManagerProps = {
	profiles: ProfilesListApi;
	currentProfile: string | null;
	onChooseProfile: (id: string | null) => void;
	onOpenProfile: OnPickProfile;
	onLoginStart: () => void;
};

export const defaultVaultNames = [
	'Creative drafts',
	'Second brain',
	'Digital garden',
	'Creative space',
	'Mind space',
	'Idea lab',
];

export const VaultScreenManager = ({
	currentProfile,
	profiles,
	onOpenProfile,
	onChooseProfile,
	onLoginStart,
}: VaultScreenManagerProps) => {
	const currentProfileObject = useMemo(
		() => profiles.profiles?.find((profile) => profile.id === currentProfile) ?? null,
		[currentProfile, profiles.profiles],
	);

	const [screen, setScreen] = useState<'create' | 'choose'>('choose');
	const hasNoProfiles = profiles.profiles.length === 0;

	if (currentProfileObject) {
		return (
			<ProfileLoginForm
				profile={currentProfileObject}
				onLogin={async (...arg) => {
					onLoginStart();
					return await onOpenProfile(...arg);
				}}
				onPickAnotherProfile={() => onChooseProfile(null)}
			/>
		);
	}

	if (screen === 'create' || hasNoProfiles) {
		return (
			<ProfileCreator
				onCreateProfile={(profile) =>
					profiles.createProfile(profile).then((newProfile) => {
						onOpenProfile(newProfile, profile.password ?? undefined).then(
							console.warn,
						);
						setScreen('choose');
					})
				}
				onCancel={hasNoProfiles ? undefined : () => setScreen('choose')}
				defaultProfileName={
					hasNoProfiles ? getRandomItem(defaultVaultNames) : undefined
				}
			/>
		);
	}

	return (
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
				items={profiles.profiles.map((profile) => ({
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
									onOpenProfile(profile);
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
