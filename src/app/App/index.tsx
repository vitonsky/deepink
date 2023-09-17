import React, { FC, useEffect, useState } from 'react';
import CryptoJs from 'crypto-js';
import aes from 'crypto-js/aes';
import { mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

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
import {
	deleteFiles,
	getFile,
	listFiles,
	uploadFile,
} from '../../electron/requests/storage/renderer';

import { MainScreen } from './MainScreen';
import { ProvidedAppContext, Providers } from './Providers';
import { SplashScreen } from './SplashScreen';
import { WorkspaceManager } from './WorkspaceManager';

import './App.css';

export const cnApp = cn('App');

export const getNoteTitle = (note: INoteData) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

export const App: FC = () => {
	const [secretKey, setSecretKey] = useState<null | string>(null);
	const [workspaceError, setWorkspaceError] = useState<null | string>(null);

	// Clear error by change secret key
	useEffect(() => {
		setWorkspaceError(null);
	}, [secretKey]);

	// Load DB
	const [db, setDb] = useState<null | SQLiteDb>(null);
	useEffect(() => {
		if (db) return;
		if (secretKey === null) return;

		(async () => {
			const profileDir = await getUserDataPath('defaultProfile');

			// Ensure profile dir exists
			mkdirSync(profileDir, { recursive: true });

			const dbPath = path.join(profileDir, 'deepink.db');
			const dbExtensionsDir = await getResourcesPath('sqlite/extensions');

			await getDb({
				dbPath,
				dbExtensionsDir,
				encryption: {
					encrypt(rawData) {
						return aes.encrypt(rawData, secretKey).toString();
					},
					decrypt(encryptedData) {
						return aes
							.decrypt(encryptedData, secretKey)
							.toString(CryptoJs.enc.Utf8);
					},
				},
			})
				.then((db) => {
					setSecretKey(null);
					setDb(db);
				})
				.catch((err) => {
					console.error(err);
					setWorkspaceError('Wrong password');
				});
		})();
	}, [db, secretKey]);

	const [providedAppContext, setProvidedAppContext] = useState<Omit<
		ProvidedAppContext,
		'db'
	> | null>(null);
	useEffect(() => {
		if (db === null) return;

		const attachmentsRegistry = new Attachments(db);

		const filesRegistry = new FilesRegistry(
			db,
			{ get: getFile, write: uploadFile, delete: deleteFiles, list: listFiles },
			attachmentsRegistry,
		);

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
	}, [db]);

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
