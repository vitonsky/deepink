import React, { FC, useCallback, useState } from 'react';
import { cn } from '@bem-react/classname';

import { INote, notes } from '../../core/Note';

import './App.css';
import { NoteEditor } from './NoteEditor';

export const cnApp = cn('App');

export const getNoteTitle = (note: INote) => note.title ?? note.text.slice(0, 35);

export const App: FC = () => {
	const [tabs, setTabs] = useState<number[]>([]);
	const [tab, setTab] = useState<number | null>(null);

	const onNoteClick = useCallback((id: number) => {
		setTabs((state) => (state.includes(id) ? state : [...state, id]));
		setTab(id);
	}, []);

	return (
		<div className={cnApp()}>
			<div className={cnApp('SideBar')}>
				{notes.map((note, id) => {
					return (
						<li key={id} onClick={() => onNoteClick(id)}>
							{getNoteTitle(note)}
						</li>
					);
				})}
			</div>
			<div className={cnApp('ContentBlock')}>
				<div>
					{tabs.map((noteId) => {
						const note = notes[noteId];
						if (!note) return undefined;

						return (
							<li key={noteId}>
								{getNoteTitle(note)} <span>[x]</span>
							</li>
						);
					})}
				</div>
				<div className={cnApp('NoteEditors')}>
					{tabs.map((id) => {
						const isActive = id === tab;
						return (
							<div
								key={id}
								className={cnApp('NoteEditor', { active: isActive })}
							>
								{' '}
								<NoteEditor id={id} />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
