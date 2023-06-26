import React, { FC, useCallback, useState } from 'react';
import { cn } from '@bem-react/classname';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { TabsMenu } from 'react-elegant-ui/esm/components/TabsMenu/TabsMenu.bundle/desktop';
import { Icon } from 'react-elegant-ui/esm/components/Icon/Icon.bundle/desktop';

import { IEditableNote, INote, notes } from '../../core/Note';

import './App.css';
import { NoteEditor } from './NoteEditor';

export const cnApp = cn('App');

export const getNoteTitle = (note: INote) => note.title ?? note.text.slice(0, 35);

export const App: FC = () => {
	const [tabs, setTabs] = useState<number[]>([]);
	const [tab, setTab] = useState<number | null>(null);

	// const [notesSlice, setNotesSlice] = useState(notes);

	const onNoteClick = useCallback((itemId: string) => {
		const id = Number(itemId);
		setTabs((state) => (state.includes(id) ? state : [...state, id]));
		setTab(id);
	}, []);

	const closeNote = useCallback(
		(id: number) => {
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

	// TODO: implement real logic
	// Simulate note update
	const updateNote = useCallback(async (note: IEditableNote) => {
		await new Promise((res) => setTimeout(res, 1000));

		const noteInDB = notes[note.id];
		if (!noteInDB) {
			console.warn('Note not found', note.id);
			return;
		}

		noteInDB.title = note.title;
		noteInDB.text = note.text;
	}, []);

	return (
		<div className={cnApp({}, [cnTheme(theme)])}>
			<div className={cnApp('SideBar')}>
				<div className={cnApp('SideBarControls')}>
					<Button view='action' onPress={() => {
						notes.unshift({ text: '123', title: '' });
					}}>New note</Button>
				</div>

				<div className={cnApp('NotesList')}>
					{/* TODO: implement dragging and moving items */}
					<Menu
						onPick={onNoteClick}
						cursorIndex={tab ?? undefined}
						items={notes.map((note, id) => {
							return {
								id: String(id),
								content: getNoteTitle(note),
								addonProps: {
									className: cnApp('NoteItem', {
										active: id === tab,
										opened: tabs.indexOf(id) !== -1,
									}),
								},
							};
						})}
					/>
				</div>
			</div>
			<div className={cnApp('ContentBlock')}>
				{/* TODO: fix bug - tabs cursor does not update when tabs updates */}
				<TabsMenu
					view="primitive"
					layout="horizontal"
					dir="horizontal"
					activeTab={String(tab)}
					setActiveTab={(id) => {
						setTab(Number(id));
					}}
					tabs={tabs.map((noteId) => {
						// TODO: handle case when object not found
						const note = notes[noteId];

						return {
							id: String(noteId),
							content: (
								<span>
									{getNoteTitle(note)}{' '}
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
						const noteObject = notes[id];
						if (!noteObject) return null;

						const note = {
							id,
							title: getNoteTitle(noteObject),
							text: noteObject.text
						}

						const isActive = id === tab;
						return (
							<div
								key={id}
								className={cnApp('NoteEditor', { active: isActive })}
							>
								<NoteEditor note={note} updateNote={updateNote} />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
