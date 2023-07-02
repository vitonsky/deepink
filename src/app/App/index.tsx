import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { mkdirSync } from 'fs';
import path from 'path';
import { cn } from '@bem-react/classname';

import { INote, INoteData, NoteId } from '../../core/Note';
import { INotesRegistry } from '../../core/Registry';
import { NotesRegistry } from '../../core/Registry/NotesRegistry';
import { getDb, SQLiteDb } from '../../core/storage/SQLiteDb';
import { electronPaths } from '../../electron/requests/files';

import { NotesList } from './MainScreen/NotesList';
import { TopBar } from './MainScreen/TopBar';
import { NoteEditor } from './NoteEditor';

import './App.css';

export const cnApp = cn('App');

export const getNoteTitle = (note: INoteData) =>
	(note.title || note.text).slice(0, 25) || 'Empty note';

// TODO: move to other file
export const MainScreen: FC<{ db: SQLiteDb }> = ({ db }) => {
	const [notesRegistry] = useState<INotesRegistry>(() => new NotesRegistry(db));
	const [tabs, setTabs] = useState<NoteId[]>([]);
	const [tab, setTab] = useState<NoteId | null>(null);
	const [notes, setNotes] = useState<INote[]>([]);

	const updateNotes = useCallback(async () => {
		const notes = await notesRegistry.get();
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		});
		setNotes(notes);
	}, [notesRegistry]);

	// Init
	useEffect(() => {
		updateNotes();
	}, [updateNotes]);

	// TODO: focus on note input
	const onNoteClick = useCallback((id: NoteId) => {
		setTabs((state) => (state.includes(id) ? state : [...state, id]));
		setTab(id);
	}, []);

	const closeNote = useCallback(
		(id: NoteId) => {
			const tabIndex = tabs.indexOf(id);

			// Change tab if it is current tab
			if (id === tab) {
				let nextTab = null;
				if (tabIndex > 0) {
					nextTab = tabs[tabIndex - 1];
				} else if (tabIndex === 0 && tabs.length > 1) {
					tabs[1];
				}
				setTab(nextTab);
			}

			setTabs((state) => state.filter((tabId) => tabId !== id));
		},
		[tab, tabs],
	);

	// Simulate note update
	const updateNote = useCallback(
		async (note: INote) => {
			await notesRegistry.update(note.id, note.data);
			updateNotes();
		},
		[notesRegistry, updateNotes],
	);

	const newNoteIdRef = useRef<NoteId | null>(null);
	const createNote = useCallback(async () => {
		const noteId = await notesRegistry.add({ title: '', text: '' });
		newNoteIdRef.current = noteId;
		updateNotes();
	}, [notesRegistry, updateNotes]);

	// Focus on new note
	useEffect(() => {
		if (newNoteIdRef.current === null) return;

		const newNoteId = newNoteIdRef.current;
		const isNoteExists = notes.find((note) => note.id === newNoteId);
		if (isNoteExists) {
			newNoteIdRef.current = null;
			onNoteClick(newNoteId);
		}
	}, [notes, onNoteClick]);

	// TODO: add memoizing for tabs mapping
	return (
		<div className={cnApp({}, [cnTheme(theme)])}>
			<div className={cnApp('SideBar')}>
				<div className={cnApp('SideBarControls')}>
					<Button view="action" onPress={createNote}>
						New note
					</Button>
				</div>

				<div className={cnApp('NotesList')}>
					<NotesList
						{...{
							notesRegistry,
							notes,
							updateNotes,
							onPick: onNoteClick,
							closeNote,
							openedNotes: tabs,
							activeNote: tab,
						}}
					/>
				</div>
			</div>
			<div className={cnApp('ContentBlock')}>
				<TopBar {...{ notes, tabs, activeTab: tab ?? null, onClose: closeNote, onPick: onNoteClick }} />
				<div className={cnApp('NoteEditors')}>
					{tabs.map((id) => {
						const noteObject = notes.find((note) => note.id === id);
						if (!noteObject) return null;

						const isActive = id === tab;
						return (
							<div
								key={id}
								className={cnApp('NoteEditor', { active: isActive })}
							>
								<NoteEditor
									note={noteObject.data}
									updateNote={(noteData) => {
										updateNote({ ...noteObject, data: noteData });
									}}
								/>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

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

	// TODO: implement splash screen
	if (db === null) {
		return <div>Loading...</div>;
	}

	return <MainScreen db={db} />;
};
