import React, { createContext, FC, useCallback, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { useProfiles } from '@features/App/useProfiles';
import { useProfileSelector } from '@features/App/useProfileSelector';
import { useProfilesManager } from '@features/App/useProfilesManager';
import { Profile } from '@features/Profile';
import { SplashScreen } from '@features/SplashScreen';
import { ProfilesApi } from '@state/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { WorkspaceManager } from '../WorkspaceManager';

import './App.css';

const config = new ConfigStorage('config.json', new ElectronFilesController('/'));

export const cnApp = cn('App');

export const profilesContext = createContext<ProfilesApi | null>(null);
export const useProfilesContext = createContextGetterHook(profilesContext);

export const App: FC = () => {
	const profilesManager = useProfilesManager();
	const profiles = useProfiles();

	const activeProfile = profiles.activeProfile;

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
					profiles.openProfile({ profile });
					setLoadingState({
						isProfilesLoading: false,
						isProfileLoading: true,
					});
				} else {
					setLoadingState((state) => ({ ...state, isProfilesLoading: false }));
				}
			},
			[profiles],
		),
	);

	useEffect(() => {
		if (activeProfile) {
			setLoadingState((state) => ({ ...state, isProfileLoading: false }));
		}
	}, [activeProfile]);

	const profile = activeProfile ? activeProfile.getContent() : null;

	const isLoadingState = Object.values(loadingState).some(Boolean);
	if (isLoadingState) {
		return <SplashScreen />;
	}

	// TODO: show `SplashScreen` component while loading
	if (profile === null || activeProfile === null) {
		return (
			<WorkspaceManager
				profiles={profiles}
				profilesManager={profilesManager}
				currentProfile={currentProfile}
				onChooseProfile={setCurrentProfile}
			/>
		);
	}

	// TODO: support multiple opened workspaces
	// TODO: support multiple opened profiles
	return (
		<div className={cnApp()}>
			<profilesContext.Provider value={profiles}>
				<Profile profile={profile} />
			</profilesContext.Provider>
		</div>
	);
};
