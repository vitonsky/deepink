import React, { FC, useEffect, useState } from 'react';
import { mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { INoteData } from '../../core/Note';
import { getDb, SQLiteDb } from '../../core/storage/SQLiteDb';
import { electronPaths } from '../../electron/requests/files';

import { MainScreen } from './MainScreen/MainScreen';
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

	return (
		<div className={cnApp()}>
			{db === null ? <SplashScreen /> : <MainScreen db={db} />}
		</div>
	);
};
