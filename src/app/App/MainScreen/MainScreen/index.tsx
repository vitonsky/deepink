import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../../core/Note';
import { INotesRegistry } from '../../../../core/Registry';
import { NotesRegistry } from '../../../../core/Registry/NotesRegistry';
import { SQLiteDb } from '../../../../core/storage/SQLiteDb';

import { Notes } from '../Notes';
import { NotesList } from '../NotesList';
import { TopBar } from '../TopBar';
import { StatusBar } from './StatusBar';

import './MainScreen.css';

export const cnMainScreen = cn('MainScreen');

export const MainScreen: FC<{ db: SQLiteDb }> = ({ db }) => {
	const [notesRegistry] = useState<INotesRegistry>(() => new NotesRegistry(db));
	const [tabs, setTabs] = useState<NoteId[]>([]);
	const [tab, setTab] = useState<NoteId | null>(null);
	const [notes, setNotes] = useState<INote[]>([]);

	const updateNotes = useCallback(async () => {
		const notes = await notesRegistry.get({ limit: 10000 });
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

	const onNoteClose = useCallback(
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
		<div className={cnMainScreen({}, [cnTheme(theme)])}>
			<div className={cnMainScreen('Content')}>
				<div className={cnMainScreen('SideBar')}>
					<div className={cnMainScreen('SideBarControls')}>
						<Button view="action" onPress={createNote}>
							New note
						</Button>
					</div>

					<div className={cnMainScreen('NotesList')}>
						<NotesList
							{...{
								notesRegistry,
								notes,
								updateNotes,
								onPick: onNoteClick,
								onClose: onNoteClose,
								openedNotes: tabs,
								activeNote: tab,
							}}
						/>
					</div>
				</div>
				<div className={cnMainScreen('ContentBlock')}>
					<TopBar
						{...{
							notesRegistry,
							updateNotes,
							notes,
							tabs,
							activeTab: tab ?? null,
							onClose: onNoteClose,
							onPick: onNoteClick,
						}}
					/>
					<div className={cnMainScreen('NoteEditors')}>
						<Notes {...{ notes, tabs, activeTab: tab ?? null, updateNote }} />
					</div>
				</div>
			</div>

			<StatusBar notesRegistry={notesRegistry} updateNotes={updateNotes} />
		</div>
	);
};
