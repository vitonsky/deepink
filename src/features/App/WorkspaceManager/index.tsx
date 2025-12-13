import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaUser } from 'react-icons/fa6';
import { Box, Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectProfileScreenMode } from '@state/redux/settings/selectors/profileScreenMode';
import { PROFILE_SCREEN_MODE, settingsApi } from '@state/redux/settings/settings';

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
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;

export type IWorkspacePickerProps = {
	profiles: ProfilesApi;
	profilesManager: ProfilesListApi;
	currentProfile: string | null;
	onChooseProfile: (id: string | null) => void;
};

/**
 * Manages a workspace profiles
 */
export const WorkspaceManager: FC<IWorkspacePickerProps> = ({
	profilesManager,
	profiles,
	currentProfile,
	onChooseProfile,
}) => {
	const telemetry = useTelemetryTracker();
	const dispatch = useAppDispatch();

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

	const [screenName, setScreenName] = useState<
		'main' | 'createProfile' | 'changeProfile'
	>('main');

	const profileScreenMode = useAppSelector(selectProfileScreenMode);
	useEffect(() => {
		if (screenName === 'main') dispatch(settingsApi.setProfileScreenMode(null));
		if (profileScreenMode === PROFILE_SCREEN_MODE.CHANGE)
			setScreenName('changeProfile');
	}, [profileScreenMode, screenName, dispatch]);

	const content = useMemo(() => {
		const isFirstProfile = profilesManager.profiles.length === 0;
		if (screenName === 'createProfile' || isFirstProfile) {
			return (
				<ProfileCreator
					onCreateProfile={(profile) =>
						profilesManager.createProfile(profile).then((newProfile) => {
							setScreenName('main');
							onOpenProfile(newProfile, profile.password ?? undefined).then(
								console.warn,
							);
						})
					}
					onCancel={() => setScreenName('changeProfile')}
					isFirstProfile={isFirstProfile}
				/>
			);
		}

		if (screenName !== 'changeProfile' && currentProfileObject) {
			return (
				<ProfileLoginForm
					profile={currentProfileObject}
					onLogin={onOpenProfile}
					onPickAnotherProfile={() => {
						setScreenName('changeProfile');
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
							onClick={() => setScreenName('createProfile')}
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
										setScreenName('main');
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
		screenName,
		telemetry,
	]);

	return (
		<Box display="flex" minH="100vh" justifyContent="center" alignItems="center">
			<Box maxW="500px" minW="350px" padding="1rem">
				{content}
			</Box>
		</Box>
	);
};
