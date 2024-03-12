import React, { FC, useCallback, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { EncryptionController } from '@core/encryption/EncryptionController';
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
import { Profile } from '@features/Profile';
import { SplashScreen } from '@features/SplashScreen';
import { ProfileEntry, profilesContext, useProfiles } from '@state/profiles';
import { useProfilesManager } from '@state/profilesManager';

import { WorkspaceManager } from '../WorkspaceManager';

import './App.css';

const config = new ConfigStorage('config.json', new ElectronFilesController('/'));

// TODO: move to features
export type ProfileContainer = {
	profile: ProfileEntry;
	db: SQLiteDatabase;
	encryptionController: EncryptionController;
};

export type WorkspaceContainer = {
	attachmentsController: AttachmentsController;
	filesController: ElectronFilesController;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: NotesController;
};

export const cnApp = cn('App');
export const getNoteTitle = (note: INoteContent) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

// TODO: remove secrets of closure
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
