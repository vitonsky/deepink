import React, { FC, useCallback, useEffect, useState } from 'react';
import { mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { IEncryptionController } from '../../core/encryption';
import { EncryptionController } from '../../core/encryption/EncryptionController';
import { WorkerEncryptionController } from '../../core/encryption/WorkerEncryptionController';
import { INoteData } from '../../core/Note';
import { Attachments } from '../../core/Registry/Attachments/Attachments';
import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';
import { NotesRegistry } from '../../core/Registry/NotesRegistry';
import { Tags } from '../../core/Registry/Tags/Tags';
import { tagsChanged, tagsUpdated } from '../../core/state/tags';
import { getDb, SQLiteDb } from '../../core/storage/SQLiteDb';
import {
	getResourcesPath,
	getUserDataPath,
} from '../../electron/requests/files/renderer';
import { ElectronFilesController } from '../../electron/requests/storage/renderer';

import { MainScreen } from './MainScreen';
import { ProvidedAppContext, Providers } from './Providers';
import { SplashScreen } from './SplashScreen';
import { OnPickProfile, ProfileObject, WorkspaceManager } from './WorkspaceManager';

import './App.css';

// TODO: generate 32 bytes salt and then encode as base64
// TODO: keep salt in user profile directory

const codec = new TextEncoder();
const salt = codec.encode("=aG$<jPJQ}qqHh?iUB%]c(x'xp(ynZ");

export const cnApp = cn('App');
export const getNoteTitle = (note: INoteData) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

const profiles: ProfileObject[] = [
	'defaultProfile127',
	'defaultProfile126',
	'defaultProfile125',
	'defaultProfile124',
].map((id) => ({
	id,
	name: id,
	isEncrypted: true,
}));

// TODO: remove secrets of closure
// TODO: all keys must be derived, never use primary key directly for encryption
// TODO: implement profiles management
export const App: FC = () => {
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
			const profile = profiles.find((profile) => profile.id === id);
			if (!profile) return { status: 'error', message: 'Profile not exists' };
			if (password === undefined) {
				if (profile.isEncrypted) {
					return { status: 'error', message: 'Enter password' };
				}

				// TODO: implement immediate open not encrypted profiles
				return { status: 'ok' };
			}

			const workerController = new WorkerEncryptionController(password, salt);
			const encryption = new EncryptionController(workerController);

			const profileDir = await getUserDataPath(profile.id);

			// Ensure profile dir exists
			mkdirSync(profileDir, { recursive: true });

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
		[],
	);

	// TODO: show only if workspace requires password
	if (db === null) {
		return (
			<WorkspaceManager
				profiles={profiles}
				currentProfile={currentProfile}
				onChooseProfile={setCurrentProfile}
				onOpenProfile={onOpenProfile}
				onCreateProfile={async (profile) => {
					await new Promise((res) => setTimeout(res, 500));
					console.log('Create profile', profile);
				}}
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
