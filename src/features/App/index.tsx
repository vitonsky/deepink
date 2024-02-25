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
import { createNotesApi, notesContext } from '@features/App/utils/notes';
import { createTagsApi, tagsContext } from '@features/App/utils/tags';

import { MainScreen } from '../MainScreen';
import { Providers } from '../Providers';
import { OnPickProfile, WorkspaceManager } from '../WorkspaceManager';
import { Profile, profilesContext, useProfiles } from './utils/profiles';
import { useProfilesManager } from './utils/profilesManager';
import { createWorkspaceApi, workspaceContext } from './utils/workspace';

import './App.css';

const config = new ConfigStorage('config.json', new ElectronFilesController('/'));

export type AppContext = {
	db: SQLiteDatabase;
	attachmentsController: AttachmentsController;
	filesController: ElectronFilesController;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: NotesController;
	profile: Profile;
};

export const cnApp = cn('App');
export const getNoteTitle = (note: INoteContent) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

// TODO: remove secrets of closure
export const App: FC = () => {
	const profilesManager = useProfilesManager();
	const profiles = useProfiles();

	const activeProfile = profiles.activeProfile;

	const [tags] = useState(createTagsApi);
	const [workspaceApi] = useState(createWorkspaceApi);

	const activeProfileId = activeProfile?.getContent().profile.id ?? 'unknown';

	// TODO: move on profile level contexts
	const [notesApi] = useState(createNotesApi);
	useEffect(() => {
		notesApi.events.notesClosed();
	}, [notesApi.events, activeProfileId]);

	const onOpenProfile: OnPickProfile = useCallback(
		async (id: string, password?: string) => {
			const profile =
				profilesManager.profiles &&
				profilesManager.profiles.find((profile) => profile.id === id);
			if (!profile) return { status: 'error', message: 'Profile not exists' };

			// Profiles with no password
			if (!profile.encryption) {
				await profiles.openProfile({ profile });
				return { status: 'ok' };
			}

			// Profiles with password
			if (password === undefined)
				return { status: 'error', message: 'Enter password' };

			try {
				await profiles.openProfile({ profile, password });
				return { status: 'ok' };
			} catch (err) {
				console.error(err);

				return { status: 'error', message: 'Invalid password' };
			}
		},
		[profilesManager.profiles, profiles],
	);

	// Run optional services for active profile
	useEffect(() => {
		if (activeProfile === null || activeProfile.isDisposed()) return;

		const { filesRegistry } = activeProfile.getContent();

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();
	}, [activeProfile]);

	// TODO: replace to hook
	// Load tags
	useEffect(() => {
		if (!activeProfile || activeProfile.isDisposed()) return;

		const { tagsRegistry } = activeProfile.getContent();
		const updateTags = () => tagsRegistry.getTags().then(tags.events.tagsUpdated);

		const cleanup = workspaceApi.events.tagsUpdateRequested.watch(updateTags);
		updateTags();

		return cleanup;
	});

	const [currentProfile, setCurrentProfile] = useProfileSelector(
		config,
		profilesManager.profiles,
		useCallback(
			(profile: ProfileObject) => {
				if (!profile.encryption) {
					onOpenProfile(profile.id);
				}
			},
			[onOpenProfile],
		),
	);

	const appContext = activeProfile ? activeProfile.getContent() : null;

	// TODO: show `SplashScreen` component while loading
	// TODO: show only if workspace requires password
	if (appContext === null) {
		return (
			<WorkspaceManager
				profiles={profilesManager.profiles ?? []}
				currentProfile={currentProfile}
				onChooseProfile={setCurrentProfile}
				onOpenProfile={onOpenProfile}
				onCreateProfile={profilesManager.createProfile}
			/>
		);
	}

	return (
		<div className={cnApp()}>
			<workspaceContext.Provider value={workspaceApi}>
				<tagsContext.Provider value={tags}>
					<notesContext.Provider value={notesApi}>
						<profilesContext.Provider value={profiles}>
							<Providers {...appContext}>
								<MainScreen key={activeProfileId} />
							</Providers>
						</profilesContext.Provider>
					</notesContext.Provider>
				</tagsContext.Provider>
			</workspaceContext.Provider>
		</div>
	);
};
