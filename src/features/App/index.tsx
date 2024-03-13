import React, { FC, useCallback, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { useProfiles } from '@features/App/useProfiles';
import { useProfileSelector } from '@features/App/useProfileSelector';
import { useProfilesManager } from '@features/App/useProfilesManager';
import { Profile } from '@features/Profile';
import { Profiles } from '@features/Profiles';
import { SplashScreen } from '@features/SplashScreen';

import { WorkspaceManager } from '../WorkspaceManager';

import './App.css';

const config = new ConfigStorage('config.json', new ElectronFilesController('/'));

export const cnApp = cn('App');

export const App: FC = () => {
	const profilesManager = useProfilesManager();
	const profilesController = useProfiles();

	const [loadingState, setLoadingState] = useState<{
		isProfilesLoading: boolean;
		isProfileLoading: boolean;
	}>({
		isProfilesLoading: true,
		isProfileLoading: false,
	});
	const [currentProfile, setCurrentProfile] = useProfileSelector(
		config,
		profilesManager.profiles,
		useCallback(
			(profile: ProfileObject | null) => {
				if (profile && !profile.encryption) {
					profilesController.openProfile({ profile }, true);
					setLoadingState({
						isProfilesLoading: false,
						isProfileLoading: true,
					});
				} else {
					setLoadingState((state) => ({ ...state, isProfilesLoading: false }));
				}
			},
			[profilesController],
		),
	);

	useEffect(() => {
		if (profilesController.profiles.length > 0) {
			setLoadingState((state) => ({ ...state, isProfileLoading: false }));
		}
	}, [profilesController.profiles.length]);

	const isLoadingState = Object.values(loadingState).some(Boolean);
	if (isLoadingState) {
		return <SplashScreen />;
	}

	if (profilesController.profiles.length === 0) {
		return (
			<WorkspaceManager
				profiles={profilesController}
				profilesManager={profilesManager}
				currentProfile={currentProfile}
				onChooseProfile={setCurrentProfile}
			/>
		);
	}

	return (
		<div className={cnApp()}>
			<Profiles profiles={profilesController}>
				{profilesController.profiles.map((profileContainer) => {
					// TODO: hide not active profile, instead of unmount
					if (profilesController.activeProfile !== profileContainer) return;

					if (profileContainer.isDisposed()) return;

					const profile = profileContainer.getContent();
					return (
						<Profile
							profile={profile}
							key={profile.profile.id}
							controls={{
								close: () =>
									profilesController.events.profileClosed(
										profileContainer,
									),
							}}
						/>
					);
				})}
			</Profiles>
		</div>
	);
};
