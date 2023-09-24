import React, { FC, useCallback, useEffect, useState } from 'react';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { IEncryptionController } from '../../core/encryption';
import { EncryptionController } from '../../core/encryption/EncryptionController';
import { base64ToBytes } from '../../core/encryption/utils/encoding';
import { getRandomBytes } from '../../core/encryption/utils/random';
import { WorkerEncryptionController } from '../../core/encryption/WorkerEncryptionController';
import { INoteData } from '../../core/Note';
import { Attachments } from '../../core/Registry/Attachments/Attachments';
import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';
import { NotesRegistry } from '../../core/Registry/NotesRegistry';
import { Tags } from '../../core/Registry/Tags/Tags';
import { tagsChanged, tagsUpdated } from '../../core/state/tags';
import { ProfileObject, ProfilesManager } from '../../core/storage/ProfilesManager';
import { getDb, SQLiteDb } from '../../core/storage/SQLiteDb';
import {
	getResourcesPath,
	getUserDataPath,
} from '../../electron/requests/files/renderer';
import { ElectronFilesController } from '../../electron/requests/storage/renderer';

import { readFile, writeFile } from 'fs/promises';
import { MainScreen } from './MainScreen';
import { ProvidedAppContext, Providers } from './Providers';
import { SplashScreen } from './SplashScreen';
import { OnPickProfile, WorkspaceManager } from './WorkspaceManager';
import { NewProfile } from './WorkspaceManager/ProfileCreator';

import './App.css';

// TODO: generate 32 bytes salt and then encode as base64
// TODO: keep salt in user profile directory

const codec = new TextEncoder();
const salt = codec.encode("=aG$<jPJQ}qqHh?iUB%]c(x'xp(ynZ");

export const cnApp = cn('App');
export const getNoteTitle = (note: INoteData) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

const pm = new ProfilesManager();

// TODO: remove secrets of closure
// TODO: all keys must be derived, never use primary key directly for encryption
// TODO: implement profiles management
export const App: FC = () => {
	const [profiles, setProfiles] = useState<null | ProfileObject[]>(null);
	const updateProfiles = useCallback(() => {
		pm.getProfiles().then(setProfiles);
	}, []);

	useEffect(() => {
		updateProfiles();
	}, [updateProfiles]);

	const createProfile = useCallback(
		async (profile: NewProfile) => {
			if (profile.password === null)
				return 'Profiles with no passwords does not supported';

			const newProfile = await pm.add({ name: profile.name });

			const salt = base64ToBytes(newProfile.encryption!.salt);
			const workerController = new WorkerEncryptionController(
				profile.password,
				new Uint8Array(salt),
			);
			const encryption = new EncryptionController(workerController);

			const key = getRandomBytes(32);
			const encryptedKey = await encryption.encrypt(key);

			workerController.terminate();

			const profileDir = await getUserDataPath(newProfile.id);

			// Ensure profile dir exists
			mkdirSync(profileDir, { recursive: true });

			// Write encrypted key
			const keyPath = path.join(profileDir, 'key');
			await writeFile(keyPath, new Uint8Array(encryptedKey));

			updateProfiles();

			return undefined;
		},
		[updateProfiles],
	);

	const [db, setDb] = useState<null | SQLiteDb>(null);
	const [profileDir, setProfileDir] = useState<null | string>(null);

	// TODO: key must be removed of memory after use
	const [encryption, setEncryption] = useState<IEncryptionController | null>(null);

	const [providedAppContext, setProvidedAppContext] = useState<Omit<
		ProvidedAppContext,
		'db'
	> | null>(null);
	useEffect(() => {
		if (db === null) return;
		if (encryption === null) return;
		if (profileDir === null) return;

		const attachmentsRegistry = new Attachments(db);

		const filesController = new ElectronFilesController(profileDir, encryption);
		const filesRegistry = new FilesRegistry(db, filesController, attachmentsRegistry);

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();

		const tagsRegistry = new Tags(db);

		const notesRegistry = new NotesRegistry(db);

		setProvidedAppContext({
			attachmentsRegistry,
			filesRegistry,
			tagsRegistry,
			notesRegistry,
		});
	}, [db, encryption, profileDir]);

	useEffect(() => {
		if (!providedAppContext) return;

		const updateTags = () =>
			providedAppContext.tagsRegistry.getTags().then(tagsUpdated);

		const cleanup = tagsChanged.watch(updateTags);
		updateTags();

		return cleanup;
	});

	const [currentProfile, setCurrentProfile] = useState<null | string>(null);

	const onOpenProfile: OnPickProfile = useCallback(
		async (id: string, password?: string) => {
			if (!profiles) return { status: 'error', message: 'Profile does not exists' };

			const profile = profiles.find((profile) => profile.id === id);
			if (!profile) return { status: 'error', message: 'Profile not exists' };
			if (password === undefined) {
				if (profile.encryption) {
					return { status: 'error', message: 'Enter password' };
				}

				// TODO: implement immediate open not encrypted profiles
				return { status: 'ok' };
			}

			const profileDir = await getUserDataPath(profile.id);

			// Ensure profile dir exists
			mkdirSync(profileDir, { recursive: true });

			const keyFilePath = path.join(profileDir, 'key');
			if (!existsSync(keyFilePath)) {
				return { status: 'error', message: 'Key file not found' };
			}

			const encryptedKeyFile = await readFile(keyFilePath);
			const salt = new Uint8Array(base64ToBytes(profile.encryption!.salt));

			function toArrayBuffer(buffer: Buffer) {
				const arrayBuffer = new ArrayBuffer(buffer.length);
				const view = new Uint8Array(arrayBuffer);
				for (let i = 0; i < buffer.length; ++i) {
					view[i] = buffer[i];
				}
				return arrayBuffer;
			}

			const workerController0 = new WorkerEncryptionController(password, salt);
			const encryption0 = new EncryptionController(workerController0);
			const key = await encryption0.decrypt(toArrayBuffer(encryptedKeyFile));
			workerController0.terminate();

			const workerController = new WorkerEncryptionController(key, salt);
			const encryption = new EncryptionController(workerController);

			const dbPath = path.join(profileDir, 'deepink.db');
			const dbExtensionsDir = await getResourcesPath('sqlite/extensions');

			try {
				await getDb({
					dbPath,
					dbExtensionsDir,
					encryption: encryption,
				}).then((db) => {
					// TODO: remove key of RAM after use. Use key only here
					// setSecretKey(null);
					setDb(db);
				});

				setEncryption(encryption);
				setProfileDir(profile.id);

				return { status: 'ok' };
			} catch (err) {
				workerController.terminate();

				console.error(err);

				return { status: 'error', message: 'Invalid password' };
			}
		},
		[profiles],
	);

	// TODO: show only if workspace requires password
	if (db === null) {
		return (
			<WorkspaceManager
				profiles={profiles ?? []}
				currentProfile={currentProfile}
				onChooseProfile={setCurrentProfile}
				onOpenProfile={onOpenProfile}
				onCreateProfile={createProfile}
			/>
		);
	}

	// Splash screen for loading state
	if (db === null || providedAppContext === null) {
		return (
			<div className={cnApp()}>
				<SplashScreen />
			</div>
		);
	}

	return (
		<div className={cnApp()}>
			<Providers {...providedAppContext} db={db}>
				<MainScreen />
			</Providers>
		</div>
	);
};
