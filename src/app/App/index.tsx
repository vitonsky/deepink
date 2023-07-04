import React, { FC, useCallback, useEffect, useState } from 'react';
import { mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { INoteData } from '../../core/Note';
import { getDb, SQLiteDb } from '../../core/storage/SQLiteDb';
import { electronPaths } from '../../electron/requests/files';
import { getFile, uploadFile } from '../../electron/requests/storage/renderer';

import { MainScreen } from './MainScreen/MainScreen';
import { FileGetter, FileUploader, Providers } from './Providers';
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

	const fileUploader: FileUploader = useCallback(async (file) => {
		return uploadFile(file);
	}, []);

	const fileGetter: FileGetter = useCallback(async (fileId) => {
		return getFile(fileId);
	}, []);

	return (
		<div className={cnApp()}>
			<Providers {...{ fileUploader, fileGetter }}>
				{db === null ? <SplashScreen /> : <MainScreen db={db} />}
			</Providers>
		</div>
	);
};
