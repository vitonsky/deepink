import React, { FC, useEffect, useState } from 'react';
import { mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { INoteData } from '../../core/Note';
import { Attachments } from '../../core/Registry/Attachments/Attachments';
import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';
import { getDb, SQLiteDb } from '../../core/storage/SQLiteDb';
import { electronPaths } from '../../electron/requests/files';
import { deleteFiles, getFile, listFiles, uploadFile } from '../../electron/requests/storage/renderer';

import { MainScreen } from './MainScreen/MainScreen';
import { Providers } from './Providers';
import { SplashScreen } from './SplashScreen';

import './App.css';

export const cnApp = cn('App');

export const getNoteTitle = (note: INoteData) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

export const App: FC = () => {
	// Load DB
	const [db, setDb] = useState<null | SQLiteDb>(null);
	useEffect(() => {
		(async () => {
			const profileDir = await electronPaths.getUserDataPath('defaultProfile');

			// Ensure profile dir exists
			mkdirSync(profileDir, { recursive: true });

			const dbPath = path.join(profileDir, 'deepink.db');
			const dbExtensionsDir = await electronPaths.getResourcesPath(
				'sqlite/extensions',
			);

			getDb({ dbPath, dbExtensionsDir }).then(setDb);
		})();
	}, []);

	const [filesRegistry, setFilesRegistry] = useState<FilesRegistry | null>(null);
	const [attachmentsRegistry, setAttachmentsRegistry] = useState<Attachments | null>(null);
	useEffect(() => {
		if (db === null) return;

		const attachments = new Attachments(db);
		setAttachmentsRegistry(attachments);

		const filesRegistry = new FilesRegistry(db, { get: getFile, write: uploadFile, delete: deleteFiles, list: listFiles }, attachments);
		setFilesRegistry(filesRegistry);

		// TODO: schedule when to run method
		filesRegistry.clearOrphaned();
	}, [db]);

	// Splash screen for loading state
	if (db === null || filesRegistry === null || attachmentsRegistry == null) {
		return <div className={cnApp()}>
			<SplashScreen />
		</div>;
	}

	return (
		<div className={cnApp()}>
			<Providers {...{ filesRegistry, attachmentsRegistry }}>
				<MainScreen db={db} />
			</Providers>
		</div>
	);
};
