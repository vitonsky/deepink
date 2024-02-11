import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'effector-react';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { EncryptionController } from '../../core/encryption/EncryptionController';
import { PlaceholderEncryptionController } from '../../core/encryption/PlaceholderEncryptionController';
import { WorkerEncryptionProxyProcessor } from '../../core/encryption/processors/WorkerEncryptionProxyProcessor';
import { base64ToBytes, bytesToBase64 } from '../../core/encryption/utils/encoding';
import { getRandomBytes } from '../../core/encryption/utils/random';
import { $activeProfile, changedActiveProfile, Profile } from '../../core/state/profiles';
import { tagsChanged, tagsUpdated } from '../../core/state/tags';
import { ConfigStorage } from '../../core/storage/ConfigStorage';
import { AttachmentsController } from '../../core/storage/controllers/attachments/AttachmentsController';
import { FilesController } from '../../core/storage/controllers/files/FilesController';
import { NotesController } from '../../core/storage/controllers/notes/NotesController';
import { TagsController } from '../../core/storage/controllers/tags/TagsController';
import {
	openDatabase,
	SQLiteDatabase,
} from '../../core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { ProfileObject, ProfilesManager } from '../../core/storage/ProfilesManager';
import { getUserDataPath } from '../../electron/requests/files/renderer';
import { ElectronFilesController } from '../../electron/requests/storage/renderer';
import { INoteContent } from '../../types/notes';
import { DisposableBox } from '../../utils/disposable';

import { readFile, writeFile } from 'fs/promises';
import { MainScreen } from './MainScreen';
import { Providers } from './Providers';
import { OnPickProfile, WorkspaceManager } from './WorkspaceManager';
import { NewProfile } from './WorkspaceManager/ProfileCreator';

import './App.css';

const config = new ConfigStorage();

type AppContext = {
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
	const [profilesManager] = useState(() => new ProfilesManager());
	const [profiles, setProfiles] = useState<null | ProfileObject[]>(null);
	const updateProfiles = useCallback(() => {
		profilesManager.getProfiles().then(setProfiles);
	}, [profilesManager]);

	// Load profiles
	useEffect(() => {
		updateProfiles();
	}, [updateProfiles]);

	const createProfile = useCallback(
		async (profile: NewProfile) => {
			if (profile.password === null) {
				const newProfile = await profilesManager.add({
					name: profile.name,
					encryption: null,
				});

				const profileDir = await getUserDataPath(newProfile.id);

				// Ensure profile dir exists
				mkdirSync(profileDir, { recursive: true });
			} else {
				const salt = getRandomBytes(96);
				const newProfile = await profilesManager.add({
					name: profile.name,
					encryption: {
						algorithm: 'default',
						salt: bytesToBase64(salt),
					},
				});

				const workerEncryption = new WorkerEncryptionProxyProcessor(
					profile.password,
					new Uint8Array(salt),
				);
				const encryption = new EncryptionController(workerEncryption);

				const key = getRandomBytes(32);
				const encryptedKey = await encryption.encrypt(key);

				workerEncryption.terminate();

				const profileDir = await getUserDataPath(newProfile.id);

				// Ensure profile dir exists
				mkdirSync(profileDir, { recursive: true });

				// Write encrypted key
				const keyPath = path.join(profileDir, 'key');
				await writeFile(keyPath, new Uint8Array(encryptedKey));
			}

			updateProfiles();

			return undefined;
		},
		[profilesManager, updateProfiles],
	);

	const [profileContext, setProfileContext] =
		useState<null | DisposableBox<AppContext>>(null);
	const runProfile = useCallback(async (profile: ProfileObject, password?: string) => {
		const cleanups: Array<() => void> = [];

		const profileDir = await getUserDataPath(profile.id);

		// Setup encryption
		let encryption: EncryptionController;
		let encryptionCleanup: null | (() => any) = null;
		if (profile.encryption === null) {
			encryption = new EncryptionController(new PlaceholderEncryptionController());
		} else {
			if (password === undefined)
				throw new TypeError('Empty password for encrypted profile');

			const keyFilePath = path.join(profileDir, 'key');
			const encryptedKeyFile = await readFile(keyFilePath);
			const salt = new Uint8Array(base64ToBytes(profile.encryption.salt));
			const key = await decryptKey(encryptedKeyFile.buffer, password, salt);

			const workerEncryption = new WorkerEncryptionProxyProcessor(key, salt);
			encryptionCleanup = () => workerEncryption.terminate();

			encryption = new EncryptionController(workerEncryption);
		}

		// Setup DB
		const db = await openDatabase(path.join(profileDir, 'deepink.db'), {
			encryption: encryption,
		});

		// TODO: close DB first and close encryption last
		cleanups.push(() => db.close());

		// Setup files
		// TODO: implement methods to close the objects after use
		const attachmentsRegistry = new AttachmentsController(db);
		const filesController = new ElectronFilesController(profile.id, encryption);
		const filesRegistry = new FilesController(
			db,
			filesController,
			attachmentsRegistry,
		);
		const tagsRegistry = new TagsController(db);
		const notesRegistry = new NotesController(db);

		const profileObject: Profile = {
			id: profile.id,
			name: profile.name,
			isEncrypted: profile.encryption !== null,
		};

		setProfileContext(
			new DisposableBox(
				{
					db,
					attachmentsRegistry,
					filesController,
					filesRegistry,
					tagsRegistry,
					notesRegistry,
					profile: profileObject,
				},
				async () => {
					// TODO: remove key of RAM. Set control with callback to remove key
					for (const cleanup of cleanups) {
						// TODO: set deadline for awaiting
						await cleanup();
					}

					if (encryptionCleanup) {
						encryptionCleanup();
					}
				},
			),
		);
	}, []);

	const onOpenProfile: OnPickProfile = useCallback(
		async (id: string, password?: string) => {
			if (!profiles) return { status: 'error', message: 'Profile does not exists' };

			const profile = profiles.find((profile) => profile.id === id);
			if (!profile) return { status: 'error', message: 'Profile not exists' };

			const profileDir = await getUserDataPath(profile.id);

			// Ensure profile dir exists
			mkdirSync(profileDir, { recursive: true });

			// Profiles with no password
			if (!profile.encryption) {
				await runProfile(profile);

				return { status: 'ok' };
			}

			// Decrypt key
			if (password === undefined)
				return { status: 'error', message: 'Enter password' };

			const keyFilePath = path.join(profileDir, 'key');
			if (!existsSync(keyFilePath)) {
				return { status: 'error', message: 'Key file not found' };
			}

			try {
				await runProfile(profile, password);

				return { status: 'ok' };
			} catch (err) {
				console.error(err);

				return { status: 'error', message: 'Invalid password' };
			}
		},
		[profiles, runProfile],
	);

	useEffect(() => {
		if (profileContext === null || profileContext.isDisposed()) return;

		const { filesRegistry, profile } = profileContext.getContent();

		changedActiveProfile(profile);

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();
	}, [profileContext]);

	const activeProfile = useStore($activeProfile);

	// terminate all processes for previous active profile: db, encryption, files, etc
	const activeProfileRef = useRef(profileContext);
	activeProfileRef.current = profileContext;

	useEffect(() => {
		if (activeProfile !== null) return;

		const profileContext = activeProfileRef.current;
		if (profileContext && !profileContext.isDisposed()) {
			profileContext.dispose();
		}
		setProfileContext(null);
	}, [activeProfile]);

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
