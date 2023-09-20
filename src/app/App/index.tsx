import React, { FC, useEffect, useState } from 'react';
import { mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { Twofish } from '../../core/encryption/ciphers/Twofish';
import { EncryptionController } from '../../core/encryption/EncryptionController';
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
import { WorkspaceManager } from './WorkspaceManager';

import './App.css';

// TODO: generate salt
// TODO: keep salt in user profile directory

// const codec = new TextEncoder();
// const salt = codec.encode("=aG$<jPJQ}qqHh?iUB%]c(x'xp(ynZ");

export const cnApp = cn('App');

export const getNoteTitle = (note: INoteData) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

export const App: FC = () => {
	const [secretKey, setSecretKey] = useState<null | string>(null);
	const [workspaceError, setWorkspaceError] = useState<null | string>(null);
	const workspaceName = 'defaultProfile77';

	const [encryption, setEncryption] = useState<EncryptionController | null>(null);
	useEffect(() => {
		// Clear error by change secret key
		setWorkspaceError(null);

		if (secretKey) {
			// TODO: implement another cipher algorithms
			// TODO: provide encryption cipher params to allow control a encryption time
			setEncryption(new EncryptionController(new Twofish(secretKey)));
			setSecretKey(null);
		}
	}, [secretKey]);

	// Load DB
	const [db, setDb] = useState<null | SQLiteDb>(null);
	useEffect(() => {
		if (db) return;
		if (encryption === null) return;

		(async () => {
			const profileDir = await getUserDataPath(workspaceName);

			// Ensure profile dir exists
			mkdirSync(profileDir, { recursive: true });

			const dbPath = path.join(profileDir, 'deepink.db');
			const dbExtensionsDir = await getResourcesPath('sqlite/extensions');

			await getDb({
				dbPath,
				dbExtensionsDir,
				encryption: encryption,
			})
				.then((db) => {
					// TODO: remove key of RAM after use. Use key only here
					// setSecretKey(null);
					setDb(db);
				})
				.catch((err) => {
					console.error(err);
					setWorkspaceError('Wrong password');
				});
		})();
	}, [db, encryption]);

	const [providedAppContext, setProvidedAppContext] = useState<Omit<
		ProvidedAppContext,
		'db'
	> | null>(null);
	useEffect(() => {
		if (db === null) return;
		if (encryption === null) return;

		const attachmentsRegistry = new Attachments(db);

		const filesController = new ElectronFilesController(workspaceName, encryption);
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
	}, [db, encryption]);

	useEffect(() => {
		if (!providedAppContext) return;

		const updateTags = () =>
			providedAppContext.tagsRegistry.getTags().then(tagsUpdated);

		const cleanup = tagsChanged.watch(updateTags);
		updateTags();

		return cleanup;
	});

	// TODO: show only if workspace requires password
	if (db === null) {
		return (
			<WorkspaceManager
				errorMessage={workspaceError}
				onSubmit={({ key }) => {
					setSecretKey(key);
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
