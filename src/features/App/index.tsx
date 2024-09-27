import React, { FC, useCallback, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { useProfileSelector } from '@features/App/useProfileSelector';
import { SplashScreen } from '@features/SplashScreen';
import { useProfiles } from '@state/profiles/useProfiles';
import { useProfilesManager } from '@state/profilesManager/useProfilesManager';

import { Profiles } from './Profiles';
import { WorkspaceManager } from './WorkspaceManager';

import './App.css';

export const cnApp = cn('App');

export const App: FC = () => {
	const [config] = useState(
		() => new ConfigStorage('config.json', new ElectronFilesController('/')),
	);

	const profilesManager = useProfilesManager();
	const profilesApi = useProfiles();

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
					profilesApi.openProfile({ profile }, true);
					setLoadingState({
						isProfilesLoading: false,
						isProfileLoading: true,
					});
				} else {
					setLoadingState((state) => ({ ...state, isProfilesLoading: false }));
				}
			},
			[profilesApi],
		),
	);

	useEffect(() => {
		if (profilesApi.profiles.length > 0) {
			setLoadingState((state) => ({ ...state, isProfileLoading: false }));
		}
	}, [profilesApi.profiles.length]);

	const isLoadingState = Object.values(loadingState).some(Boolean);
	if (isLoadingState) {
		return <SplashScreen />;
	}

	if (profilesApi.profiles.length === 0) {
		return (
			<WorkspaceManager
				profiles={profilesApi}
				profilesManager={profilesManager}
				currentProfile={currentProfile}
				onChooseProfile={setCurrentProfile}
			/>
		);
	}

	return (
		<div className={cnApp()}>
			<Profiles profilesApi={profilesApi} />
		</div>
	);
};
