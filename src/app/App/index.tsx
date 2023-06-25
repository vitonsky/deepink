import React, { FC, useCallback, useState } from 'react';
import { cn } from '@bem-react/classname';

import { INote, notes } from '../../core/Note';

import './App.css';

const cnApp = cn('App');

const getNoteTitle = (note: INote) => note.title ?? note.text.slice(0, 35);

export const App: FC = () => {
	const [tabs, setTabs] = useState<number[]>([]);
	const [tab, setTab] = useState<number | null>(null);

	const onNoteClick = useCallback((id: number) => {
		setTabs((state) => state.includes(id) ? state : [...state, id]);
		setTab(id);
	}, []);

	const activeNote = tab !== null ? notes[tab] : null;

	return <div className={cnApp()}>
		<div className={cnApp('SideBar')}>
			{notes.map((note, id) => {
				return <li key={id} onClick={() => onNoteClick(id)}>{getNoteTitle(note)}</li>;
			})}
		</div>
		<div className={cnApp('ContentBlock')}>
			<div>
				{tabs.map((noteId) => {
					const note = notes[noteId];
					if (!note) return undefined;

					return <li key={noteId}>{getNoteTitle(note)} <span>[x]</span></li>;
				})}
			</div>
			<div>
				{activeNote && <div>
					<h2>{getNoteTitle(activeNote)}</h2>
					<div>{activeNote.text}</div>
				</div>}
			</div>
		</div>
	</div>;
};