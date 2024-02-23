import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@bem-react/classname';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { WorkerEncryptionProxyProcessor } from '@core/encryption/processors/WorkerEncryptionProxyProcessor';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INoteContent } from '@core/features/notes';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { changedActiveProfile, Profile } from '@core/state/profiles';
import { tagsChanged, tagsUpdated } from '@core/state/tags';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { SQLiteDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { ElectronFilesController } from '@electron/requests/storage/renderer';

import { MainScreen } from '../MainScreen';
import { Providers } from '../Providers';
import { OnPickProfile, WorkspaceManager } from '../WorkspaceManager';
import { useOpenedProfiles } from './utils/openedProfiles';
import { useProfiles } from './utils/profiles';

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
	const { profiles, createProfile } = useProfiles();

	const openedProfiles = useOpenedProfiles();

	// TODO: map store in hook
	const profileContext = openedProfiles.profiles.at(-1) ?? null;

	const onOpenProfile: OnPickProfile = useCallback(
		async (id: string, password?: string) => {
			const profile = profiles && profiles.find((profile) => profile.id === id);
			if (!profile) return { status: 'error', message: 'Profile not exists' };

			// Profiles with no password
			if (!profile.encryption) {
				await openedProfiles.openProfile({ profile });
				return { status: 'ok' };
			}

			// Profiles with password
			if (password === undefined)
				return { status: 'error', message: 'Enter password' };

			try {
				await openedProfiles.openProfile({ profile, password });
				return { status: 'ok' };
			} catch (err) {
				console.error(err);

				return { status: 'error', message: 'Invalid password' };
			}
		},
		[profiles, openedProfiles],
	);

	useEffect(() => {
		if (profileContext === null || profileContext.isDisposed()) return;

		const { filesRegistry, profile } = profileContext.getContent();

		changedActiveProfile(profile);

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();
	}, [profileContext]);

	// TODO: reimplement
	// const activeProfile = useStore($activeProfile);

	// terminate all processes for previous active profile: db, encryption, files, etc
	// const activeProfileRef = useRef(profileContext);
	// activeProfileRef.current = profileContext;

	// useEffect(() => {
	// 	if (activeProfile !== null) return;

	// 	const profileContext = activeProfileRef.current;
	// 	if (profileContext) {
	// 		openedProfiles.closeProfile(profileContext);
	// 	}
	// }, [activeProfile, openedProfiles]);

	useEffect(() => {
		if (!profileContext || profileContext.isDisposed()) return;

		const { tagsRegistry } = profileContext.getContent();
		const updateTags = () => tagsRegistry.getTags().then(tagsUpdated);

		const cleanup = tagsChanged.watch(updateTags);
		updateTags();

		return cleanup;
	});

	const [currentProfile, setCurrentProfile] = useState<null | string>(null);
	const isActiveProfileRestoredRef = useRef(false);
	useEffect(() => {
		if (profiles === null) return;
		if (isActiveProfileRestoredRef.current) return;

		config.get('activeProfile').then((activeProfile) => {
			isActiveProfileRestoredRef.current = true;

			if (activeProfile) {
				setCurrentProfile(activeProfile);

				if (!profiles) return;

				const profile = profiles.find((profile) => profile.id === activeProfile);
				if (!profile) return;

				if (profile.encryption === null) {
					onOpenProfile(profile.id);
				}
			}
		});
	}, [onOpenProfile, profiles]);

	const onChooseProfile = useCallback((profileId: string | null) => {
		if (profileId !== null) {
			config.set('activeProfile', profileId);
		}

		setCurrentProfile(profileId);
	}, []);

	const appContext = profileContext ? profileContext.getContent() : null;

	// TODO: show `SplashScreen` component while loading
	// TODO: show only if workspace requires password
	if (appContext === null) {
		return (
			<WorkspaceManager
				profiles={profiles ?? []}
				currentProfile={currentProfile}
				onChooseProfile={onChooseProfile}
				onOpenProfile={onOpenProfile}
				onCreateProfile={createProfile}
			/>
		);
	}

	return (
		<div className={cnApp()}>
			<Providers {...appContext}>
				<MainScreen />
			</Providers>
		</div>
	);
};
