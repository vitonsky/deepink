import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@bem-react/classname';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { TabsMenu } from 'react-elegant-ui/esm/components/TabsMenu/TabsMenu.bundle/desktop';
import { Icon } from 'react-elegant-ui/esm/components/Icon/Icon.bundle/desktop';

import { INote, INoteData } from '../../core/Note';
import { notesRegistry } from '../../app';

import './App.css';
import { NoteEditor } from './NoteEditor';

export const cnApp = cn('App');

export const getNoteTitle = (note: INoteData) => (note.title || note.text).slice(0, 25) || 'Empty note';

export const App: FC = () => {
	const [tabs, setTabs] = useState<string[]>([]);
	const [tab, setTab] = useState<string | null>(null);
	const [notes, setNotes] = useState<INote[]>([]);

	// console.warn('Updated notes', notes);

	const updateNotes = useCallback(async () => {
		const notes = await notesRegistry.getNotes();
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		})
		setNotes(notes);
	}, []);

	// Init
	useEffect(() => {
		updateNotes();
	}, []);

	// TODO: focus on note input
	const onNoteClick = useCallback((id: string) => {
		setTabs((state) => (state.includes(id) ? state : [...state, id]));
		setTab(id);
	}, []);

	const closeNote = useCallback(
		(id: string) => {
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
		[tabs],
	);

	// Simulate note update
	const updateNote = useCallback(async (note: INote) => {
		await notesRegistry.updateNote(note.id, note.data);
		updateNotes();
	}, []);

	const newNoteIdRef = useRef<null | string>(null);
	const createNote = useCallback(async () => {
		const noteId = await notesRegistry.addNote({ title: '', text: '' });
		newNoteIdRef.current = noteId;
		updateNotes();
	}, []);

	// Focus on new note
	useEffect(() => {
		if (newNoteIdRef.current === null) return;

		const newNoteId = newNoteIdRef.current;
		const isNoteExists = notes.find((note) => note.id === newNoteId);
		if (isNoteExists) {
			newNoteIdRef.current = null;
			onNoteClick(newNoteId)
		}
	}, [notes])

	return (
		<div className={cnApp({}, [cnTheme(theme)])}>
			<div className={cnApp('SideBar')}>
				<div className={cnApp('SideBarControls')}>
					<Button view='action' onPress={createNote}>New note</Button>
				</div>

				<div className={cnApp('NotesList')}>
					{/* TODO: implement dragging and moving items */}
					<Menu
						onPick={onNoteClick}
						items={notes.map((note) => {
							return {
								id: note.id,
								content: getNoteTitle(note.data),
								addonProps: {
									className: cnApp('NoteItem', {
										active: note.id === tab,
										opened: tabs.indexOf(note.id) !== -1,
									}),
								},
							};
						})}
					/>
				</div>
			</div>
			<div className={cnApp('ContentBlock')}>
				{/* TODO: improve tabs style */}
				<TabsMenu
					view="primitive"
					layout="horizontal"
					dir="horizontal"
					activeTab={tab || undefined}
					setActiveTab={setTab}
					tabs={tabs.map((noteId) => {
						// TODO: handle case when object not found
						const note = notes.find((note) => note.id === noteId);
						if (!note) {
							throw new Error('Note not found');
						}

						return {
							id: noteId,
							content: (
								<span>
									{getNoteTitle(note.data)}{' '}
									<span
										onClick={(evt) => {
											evt.stopPropagation();
											console.log(noteId);
											closeNote(noteId);
										}}
									>
										<Icon glyph="cancel" size="s" />
									</span>
								</span>
							),
						};
					})}
				/>
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
								<NoteEditor note={noteObject.data} updateNote={(noteData) => {
									updateNote({ ...noteObject, data: noteData })
								}} />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
