import React, { FC, useMemo, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { cn } from '@bem-react/classname';

import { ProfileObject } from '../../../core/storage/ProfilesManager';

import { ProfileCreator, ProfileCreatorProps } from './ProfileCreator';
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
	profiles: ProfileObject[];
	currentProfile: string | null;
	onChooseProfile: (id: string | null) => void;
	onOpenProfile: OnPickProfile;
	onCreateProfile: ProfileCreatorProps['onCreateProfile'];
};

// TODO: allow to choose algorithm
/**
 * Manages a workspace profiles
 */
export const WorkspaceManager: FC<IWorkspacePickerProps> = ({
	profiles,
	currentProfile,
	onChooseProfile,
	onOpenProfile,
	onCreateProfile,
}) => {
	const currentProfileObject = useMemo(
		() => profiles.find((profile) => profile.id === currentProfile) ?? null,
		[currentProfile, profiles],
	);

	const [screenName, setScreenName] = useState<'main' | 'createProfile'>('main');

	const content = useMemo(() => {
		if (screenName === 'createProfile') {
			return (
				<ProfileCreator
					onCreateProfile={(profile) =>
						onCreateProfile(profile).then((error) => {
							if (error) return error;

							setScreenName('main');
							return undefined;
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
					{profiles.map((profile) => (
						<li
							key={profile.id}
							onClick={() => {
								onChooseProfile(profile.id);
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
		onCreateProfile,
		onOpenProfile,
		profiles,
		screenName,
	]);

	return <div className={cnWorkspaceManager({}, [cnTheme(theme)])}>{content}</div>;
};
