import React, { FC, useEffect, useState } from 'react';
import saveAs from 'file-saver';
import { mkdirSync } from 'fs';
import { CancellationToken, editor, languages } from 'monaco-editor-core';
import path from 'path';
import { cn } from '@bem-react/classname';

import { INoteData } from '../../core/Note';
import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';
import { getDb, SQLiteDb } from '../../core/storage/SQLiteDb';
import { electronPaths } from '../../electron/requests/files';
import { getFile, uploadFile } from '../../electron/requests/storage/renderer';

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
	useEffect(() => {
		if (db === null) return;

		setFilesRegistry(new FilesRegistry(db, { get: getFile, write: uploadFile }));
	}, [db]);

	// Register files opener
	useEffect(() => {
		if (filesRegistry === null) return;

		languages.registerLinkProvider('markdown', {
			provideLinks:
				(model: editor.ITextModel, token: CancellationToken):
					languages.ProviderResult<languages.ILinksList> => {
					console.log('Link provider', { model, token });

					return {
						links: Array.from(model.getValue().matchAll(/deepink:\/\/(file)\/[\d\a-z\-]+/gi)).map((match) => {
							const index = match.index as number;
							const matchString = match[0] as string;
							const startPosition = model.getPositionAt(index);
							const endPosition = model.getPositionAt(index + matchString.length);

							return {
								range: {
									startLineNumber: startPosition.lineNumber,
									startColumn: startPosition.column,
									endLineNumber: endPosition.lineNumber,
									endColumn: endPosition.column
								},
								url: matchString
							};
						})
					};
				},
		});

		const opener = editor.registerLinkOpener({
			async open(resource) {
				console.log('Resource handler', resource);

				if (resource.scheme !== 'deepink') return false;
				if (resource.authority !== 'file') return false;

				const fileId = resource.path.slice(1);
				// const isConfirmed = confirm(`Download file "${fileId}"?`);
				// if (!isConfirmed) return false;

				const file = await filesRegistry.get(fileId);
				if (!file) return false;

				const buffer = await file.arrayBuffer();
				saveAs(new Blob([buffer]), file.name);
				return true;
			},
		});

		return () => {
			opener.dispose();
		};
	}, [filesRegistry]);

	console.log('App DB', db);

	// Splash screen for loading state
	if (db === null || filesRegistry === null) {
		return <div className={cnApp()}>
			<SplashScreen />
		</div>;
	}

	return (
		<div className={cnApp()}>
			<Providers {...{ filesRegistry }}>
				<MainScreen db={db} />
			</Providers>
		</div>
	);
};
