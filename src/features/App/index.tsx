import React, { FC, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { SplashScreen } from '@features/SplashScreen';

import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { WorkspaceManager } from './WorkspaceManager';

import './App.css';

export const cnApp = cn('App');

export const App: FC = () => {
	const [config] = useState(
		() => new ConfigStorage('config.json', new ElectronFilesController('/')),
	);

	const profilesList = useProfilesList();
	const profileContainers = useProfileContainers();

	const [loadingState, setLoadingState] = useState<{
		isProfilesLoading: boolean;
		isProfileLoading: boolean;
	}>({
		isProfilesLoading: true,
		isProfileLoading: false,
	});
	const [currentProfile, setCurrentProfile] = useProfileSelector(config);

	// Open recent profile
	const recentProfile = useRecentProfile(config);
	useEffect(
		() => {
			if (!profilesList.isProfilesLoaded || !recentProfile.isLoaded) return;

			// Restore profile id
			setCurrentProfile(recentProfile.profileId);

			const profile = profilesList.profiles.find(
				(profile) => profile.id === recentProfile.profileId,
			);
			if (!profile || profile.encryption) {
				setLoadingState((state) => ({ ...state, isProfilesLoading: false }));
				return;
			}

			// Automatically open profile with no encryption
			profileContainers.openProfile({ profile }, true);
			setLoadingState({
				isProfilesLoading: false,
				isProfileLoading: true,
			});
		},

		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profilesList.isProfilesLoaded, recentProfile.isLoaded],
	);

	useEffect(() => {
		if (profileContainers.profiles.length > 0) {
			setLoadingState((state) => ({ ...state, isProfileLoading: false }));
		}
	}, [profileContainers.profiles.length]);

	const isLoadingState = Object.values(loadingState).some(Boolean);
	if (isLoadingState) {
		return <SplashScreen />;
	}

	if (profileContainers.profiles.length === 0) {
		return (
			<WorkspaceManager
				profiles={profileContainers}
				profilesManager={profilesList}
				currentProfile={currentProfile}
				onChooseProfile={setCurrentProfile}
			/>
		);
	}

	return (
		<div className={cnApp()}>
			<Profiles profilesApi={profileContainers} />
		</div>
	);
};
