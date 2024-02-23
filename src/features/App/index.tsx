import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@bem-react/classname';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { WorkerEncryptionProxyProcessor } from '@core/encryption/processors/WorkerEncryptionProxyProcessor';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INoteContent } from '@core/features/notes';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { Profile } from '@core/state/profiles';
import { tagsChanged, tagsUpdated } from '@core/state/tags';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { SQLiteDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { ElectronFilesController } from '@electron/requests/storage/renderer';

import { MainScreen } from '../MainScreen';
import { Providers } from '../Providers';
import { OnPickProfile, WorkspaceManager } from '../WorkspaceManager';
import { profilesContext, useProfiles } from './utils/openedProfiles';
import { useProfilesManager } from './utils/profilesManager';

import './App.css';

const config = new ConfigStorage('config.json', new ElectronFilesController('/'));

export type AppContext = {
	db: SQLiteDatabase;
	attachmentsRegistry: AttachmentsController;
	filesController: ElectronFilesController;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: NotesController;
	profile: Profile;
};

export const cnApp = cn('App');
export const getNoteTitle = (note: INoteContent) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

export const decryptKey = async (
	encryptedKey: ArrayBuffer,
	password: string,
	salt: ArrayBuffer,
) => {
	const workerEncryptionForKey = new WorkerEncryptionProxyProcessor(password, salt);
	const encryptionForKey = new EncryptionController(workerEncryptionForKey);
	return encryptionForKey.decrypt(encryptedKey).finally(() => {
		workerEncryptionForKey.terminate();
	});
};

// TODO: remove secrets of closure
export const App: FC = () => {
	const profilesManager = useProfilesManager();
	const profiles = useProfiles();

	const activeProfile = profiles.activeProfile;

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
		const updateTags = () => tagsRegistry.getTags().then(tagsUpdated);

		const cleanup = tagsChanged.watch(updateTags);
		updateTags();

		return cleanup;
	});

	const [currentProfile, setCurrentProfile] = useState<null | string>(null);
	const isActiveProfileRestoredRef = useRef(false);
	useEffect(() => {
		if (profilesManager.profiles === null) return;
		if (isActiveProfileRestoredRef.current) return;

		config.get('activeProfile').then((activeProfile) => {
			isActiveProfileRestoredRef.current = true;

			if (activeProfile) {
				setCurrentProfile(activeProfile);

				if (!profilesManager.profiles) return;

				const profile = profilesManager.profiles.find(
					(profile) => profile.id === activeProfile,
				);
				if (!profile) return;

				if (profile.encryption === null) {
					onOpenProfile(profile.id);
				}
			}
		});
	}, [onOpenProfile, profilesManager.profiles]);

	const onChooseProfile = useCallback((profileId: string | null) => {
		if (profileId !== null) {
			config.set('activeProfile', profileId);
		}

		setCurrentProfile(profileId);
	}, []);

	const appContext = activeProfile ? activeProfile.getContent() : null;

	// TODO: show `SplashScreen` component while loading
	// TODO: show only if workspace requires password
	if (appContext === null) {
		return (
			<WorkspaceManager
				profiles={profilesManager.profiles ?? []}
				currentProfile={currentProfile}
				onChooseProfile={onChooseProfile}
				onOpenProfile={onOpenProfile}
				onCreateProfile={profilesManager.createProfile}
			/>
		);
	}

	return (
		<div className={cnApp()}>
			<profilesContext.Provider value={profiles}>
				<Providers {...appContext}>
					<MainScreen
						key={activeProfile?.getContent().profile.id ?? 'unknown'}
					/>
				</Providers>
			</profilesContext.Provider>
		</div>
	);
};