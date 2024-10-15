import React, { FC, useCallback, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';

import { ProfilesApi } from '../Profiles/hooks/useProfileContainers';
import { ProfilesListApi } from '../useProfilesList';
import { ProfileCreator } from './ProfileCreator';
import { ProfileLoginForm } from './ProfileLoginForm';
import { ProfilesForm } from './ProfilesForm';

type PickProfileResponse = {
	status: 'ok' | 'error';
	message?: string;
};

export type OnPickProfile = (
	id: string,
	password?: string,
) => Promise<PickProfileResponse>;

export type IWorkspacePickerProps = {
	profiles: ProfilesApi;
	profilesManager: ProfilesListApi;
	currentProfile: string | null;
	onChooseProfile: (id: string | null) => void;
};

// TODO: allow to choose algorithm
/**
 * Manages a workspace profiles
 */
export const WorkspaceManager: FC<IWorkspacePickerProps> = ({
	profilesManager,
	profiles,
	currentProfile,
	onChooseProfile,
}) => {
	const onOpenProfile: OnPickProfile = useCallback(
		async (id: string, password?: string) => {
			const profile =
				profilesManager.profiles &&
				profilesManager.profiles.find((profile) => profile.id === id);
			if (!profile) return { status: 'error', message: 'Profile not exists' };

			// Profiles with no password
			if (!profile.encryption) {
				await profiles.openProfile({ profile }, true);
				return { status: 'ok' };
			}

			// Profiles with password
			if (password === undefined)
				return { status: 'error', message: 'Enter password' };

			try {
				await profiles.openProfile({ profile, password }, true);
				return { status: 'ok' };
			} catch (err) {
				console.error(err);

				return { status: 'error', message: 'Invalid password' };
			}
		},
		[profilesManager.profiles, profiles],
	);

	const currentProfileObject = useMemo(
		() =>
			profilesManager.profiles?.find((profile) => profile.id === currentProfile) ??
			null,
		[currentProfile, profilesManager.profiles],
	);

	const [screenName, setScreenName] = useState<'main' | 'createProfile'>('main');

	const content = useMemo(() => {
		if (screenName === 'createProfile') {
			return (
				<ProfileCreator
					onCreateProfile={(profile) =>
						profilesManager.createProfile(profile).then(() => {
							setScreenName('main');
						})
					}
					onCancel={() => setScreenName('main')}
				/>
			);
		}

		if (currentProfileObject) {
			return (
				<ProfileLoginForm
					profile={currentProfileObject}
					onLogin={onOpenProfile}
					onPickAnotherProfile={() => {
						onChooseProfile(null);
					}}
				/>
			);
		}

		return (
			<ProfilesForm
				title="Choose the profile"
				controls={
					<>
						<Button
							colorScheme="primary"
							size="lg"
							w="100%"
							onClick={() => setScreenName('createProfile')}
						>
							Create new profile
						</Button>
					</>
				}
			>
				<VStack
					w="100%"
					gap="1px"
					bgColor="#3667b5"
					border="1px solid #3667b5"
					borderRadius="4px"
					maxHeight="230px"
					overflow="auto"
				>
					{(profilesManager.profiles ?? []).map((profile) => (
						<HStack
							as="button"
							sx={{
								backgroundColor: '#f2f2f3',
								padding: '.8rem 1rem',
								w: '100%',
								cursor: 'pointer',
								gap: '.8rem',
								'&:hover': {
									backgroundColor: '#ededee',
								},
							}}
							key={profile.id}
							onClick={() => {
								onChooseProfile(profile.id);
								if (profile.encryption === null) {
									onOpenProfile(profile.id);
								}
							}}
						>
							<FaUser />
							<Text>{profile.name}</Text>
						</HStack>
					))}
				</VStack>
			</ProfilesForm>
		);
	}, [
		currentProfileObject,
		onChooseProfile,
		onOpenProfile,
		profilesManager,
		screenName,
	]);

	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				{content}
			</Box>
		</Box>
	);
};
