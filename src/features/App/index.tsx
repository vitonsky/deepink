import React, { FC, useCallback, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INoteContent } from '@core/features/notes';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { SQLiteDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { useProfileSelector } from '@features/App/useProfileSelector';
import { SplashScreen } from '@features/SplashScreen';
import { Workspace } from '@features/Workspace';
import { Profile, profilesContext, useProfiles } from '@state/profiles';
import { useProfilesManager } from '@state/profilesManager';

import { MainScreen } from '../MainScreen';
import { Providers } from '../Providers';
import { WorkspaceManager } from '../WorkspaceManager';

import './App.css';

const config = new ConfigStorage('config.json', new ElectronFilesController('/'));

export type ProfileContainer = {
	profile: Profile;
	db: SQLiteDatabase;
};

export type WorkspaceContainer = {
	attachmentsController: AttachmentsController;
	filesController: ElectronFilesController;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: NotesController;
};

export type AppContext = ProfileContainer & WorkspaceContainer;

export const cnApp = cn('App');
export const getNoteTitle = (note: INoteContent) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

// TODO: remove secrets of closure
export const App: FC = () => {
	const profilesManager = useProfilesManager();
	const profiles = useProfiles();

	const activeProfile = profiles.activeProfile;
	const activeProfileId = activeProfile?.getContent().profile.id ?? 'unknown';

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

	const appContext = activeProfile ? activeProfile.getContent() : null;

	const isLoadingState = Object.values(loadingState).some(Boolean);
	if (isLoadingState) {
		return <SplashScreen />;
	}

	// TODO: show `SplashScreen` component while loading
	if (appContext === null || activeProfile === null) {
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
				<Providers {...appContext}>
					<Workspace profile={activeProfile}>
						<MainScreen key={activeProfileId} />
					</Workspace>
				</Providers>
			</profilesContext.Provider>
		</div>
	);
};
