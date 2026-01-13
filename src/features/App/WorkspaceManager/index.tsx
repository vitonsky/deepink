import React, { FC, useCallback, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Box, Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { SplashScreen } from '@features/SplashScreen';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';

import { ProfilesApi } from '../Profiles/hooks/useProfileContainers';
import { ProfilesListApi } from '../useProfilesList';
import { ProfileCreator } from './ProfileCreator';
import { ProfileLoginForm } from './ProfileLoginForm';
import { ProfilesForm } from './ProfilesForm';
import { PROFILE_SCREEN } from '..';

type PickProfileResponse = {
	status: 'ok' | 'error';
	message?: string;
};

export type OnPickProfile = (
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;

export type IWorkspacePickerProps = {
	profiles: ProfilesApi;
	profilesManager: ProfilesListApi;
	currentProfile: string | null;
	onChooseProfile: (id: string | null) => void;
	screenMode: PROFILE_SCREEN | null;
};

/**
 * Manages a workspace profiles
 */
export const WorkspaceManager: FC<IWorkspacePickerProps> = ({
	profilesManager,
	profiles,
	currentProfile,
	onChooseProfile,
	screenMode,
}) => {
	const telemetry = useTelemetryTracker();
	const command = useCommand();

	const onOpenProfile: OnPickProfile = useCallback(
		async (profile: ProfileObject, password?: string) => {
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
		[profiles],
	);

	const currentProfileObject = useMemo(
		() =>
			profilesManager.profiles?.find((profile) => profile.id === currentProfile) ??
			null,
		[currentProfile, profilesManager.profiles],
	);

	const [isLoading, setIsLoading] = useState(false);

	const content = useMemo(() => {
		// show a loading screen while the profile is being created
		if (isLoading === true) return <SplashScreen />;

		const hasNoProfiles = profilesManager.profiles.length === 0;
		if (screenMode === PROFILE_SCREEN.CREATE || hasNoProfiles) {
			return (
				<ProfileCreator
					onCreateProfile={async (profile) => {
						setIsLoading(true);

						const newProfile = await profilesManager.createProfile(profile);
						const response = await onOpenProfile(
							newProfile,
							profile.password ?? undefined,
						);
						console.warn(response);

						setIsLoading(false);
					}}
					onCancel={() =>
						command(GLOBAL_COMMANDS.OPEN_PROFILE_SCREEN, {
							screen: PROFILE_SCREEN.CHANGE,
						})
					}
					isFirstProfile={hasNoProfiles}
				/>
			);
		}

		if (screenMode === PROFILE_SCREEN.LOCK && currentProfileObject) {
			return (
				<ProfileLoginForm
					profile={currentProfileObject}
					onLogin={onOpenProfile}
					onPickAnotherProfile={() => {
						command(GLOBAL_COMMANDS.OPEN_PROFILE_SCREEN, {
							screen: PROFILE_SCREEN.CHANGE,
						});
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
							variant="accent"
							size="lg"
							w="100%"
							onClick={() =>
								command(GLOBAL_COMMANDS.OPEN_PROFILE_SCREEN, {
									screen: PROFILE_SCREEN.CREATE,
								})
							}
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
								sx={{
									padding: '.8rem 1rem',
									w: '100%',
									cursor: 'pointer',
									gap: '.8rem',
								}}
								key={profile.id}
								onClick={() => {
									onChooseProfile(profile.id);
									if (profile.encryption === null) {
										onOpenProfile(profile);
									} else {
										command(GLOBAL_COMMANDS.OPEN_PROFILE_SCREEN, {
											screen: PROFILE_SCREEN.LOCK,
										});
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
		);
	}, [
		currentProfileObject,
		onChooseProfile,
		onOpenProfile,
		profilesManager,
		telemetry,
		isLoading,
		screenMode,
	]);

	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				{content}
			</Box>
		</Box>
	);
};
