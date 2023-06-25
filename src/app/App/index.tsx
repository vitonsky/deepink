import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { notes } from '../../core/Note';

import './App.css';

const cnApp = cn('App');

export const App: FC = () => {
	return <div className={cnApp()}>
		<div className={cnApp('SideBar')}>
			{notes.map((note, id) => {
				return <li key={id}>{note.title ?? note.text.slice(0, 35)}</li>;
			})}
		</div>
		<div className={cnApp('ContentBlock')}>
			Content
		</div>
	</div>;
};