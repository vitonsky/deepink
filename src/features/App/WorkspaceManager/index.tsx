import React, { FC, useCallback, useMemo, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { cn } from '@bem-react/classname';

import { ProfilesApi } from '../Profiles/hooks/useProfileContainers';
import { ProfilesManagerApi } from '../useProfilesList';
import { ProfileCreator } from './ProfileCreator';
import { ProfileLoginForm } from './ProfileLoginForm';

import './WorkspaceManager.css';

export const cnWorkspaceManager = cn('WorkspaceManager');

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
	profilesManager: ProfilesManagerApi;
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
			<div className={cnWorkspaceManager('Container')}>
				<h3 className={cnWorkspaceManager('Header')}>Choose the profile</h3>

				<ul className={cnWorkspaceManager('ProfilesList')}>
					{(profilesManager.profiles ?? []).map((profile) => (
						<li
							key={profile.id}
							onClick={() => {
								onChooseProfile(profile.id);
								if (profile.encryption === null) {
									onOpenProfile(profile.id);
								}
							}}
						>
							{profile.name}
						</li>
					))}
				</ul>

				<Button
					view="action"
					size="l"
					onClick={() => setScreenName('createProfile')}
				>
					Create a new profile
				</Button>
			</div>
		);
	}, [
		currentProfileObject,
		onChooseProfile,
		onOpenProfile,
		profilesManager,
		screenName,
	]);

	return <div className={cnWorkspaceManager({}, [cnTheme(theme)])}>{content}</div>;
};
