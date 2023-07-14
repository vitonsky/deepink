import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { INote } from '../../../core/Note';

import './NoteScreen.css';

const cnNoteScreen = cn('NoteScreen');

export type NoteScreenProps = {
	note: INote;
};

export const NoteScreen: FC<NoteScreenProps> = ({ note }) => {
	return <div className={cnNoteScreen()}>
		<div className={cnNoteScreen('Placeholder')}>{JSON.stringify(note.data, null, 2)}</div>
	</div>;
};
