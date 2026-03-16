import React, { FC, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { FileController } from '@core/features/files/FileController';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { openSQLite } from '@core/storage/database/sqlite/openSQLite';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';

import { AppServices } from './AppServices';
import { Profiles } from './Profiles';
import { useProfileContainers } from './Profiles/hooks/useProfileContainers';
import { useProfileSelector } from './useProfileSelector';
import { useProfilesList } from './useProfilesList';
import { useRecentProfile } from './useRecentProfile';
import { WorkspaceManager } from './WorkspaceManager';

openSQLite(new FileController('/db', new InMemoryFS())).then((db) => {
	console.log('Spawned SQLite in worker', db);

	(window as any).db = db;
	(window as any).time = async () => {
		const time = await db.query(
			`SELECT strftime('%Y-%m-%d %H:%M:%S', datetime('now')) as now`,
		);
		console.log('Time', time[0]);
	};
});

export const App: FC = () => {
	const files = useFilesStorage();
	const config = useMemo(() => new ConfigStorage('config.json', files), [files]);

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

	// Handle case with auto open profile. Wait the end of loading
	useEffect(() => {
		if (profileContainers.profiles.length > 0) {
			setLoadingState((state) => ({ ...state, isProfileLoading: false }));
		}
	}, [profileContainers.profiles.length]);

	const isLoadingState = Object.values(loadingState).some(Boolean);
	const [isShowSplash] = useDebounce(isLoadingState, 500);
	if (isShowSplash) {
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
		<Box
			sx={{
				display: 'flex',
				width: '100%',
				height: '100vh',
			}}
		>
			<Profiles profilesApi={profileContainers} />
			<AppServices />
		</Box>
	);
};
