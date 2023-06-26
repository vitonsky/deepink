import { FC, useMemo, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';

import { notes } from '../../../core/Note';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import React from 'react';
import { getNoteTitle } from '..';
import { cn } from '@bem-react/classname';

import './NoteEditor.css';

const cnNoteEditor = cn('NoteEditor');

// TODO: provide note object instead of id
export const NoteEditor: FC<{ id: number }> = ({ id }) => {
	const note = useMemo(() => notes[id], [id]);

	const [text, setText] = useState(note.text ?? '');

	if (!note) return null;

	return (
		<div className={cnNoteEditor()}>
			<Textinput value={getNoteTitle(note)} />
			<MonacoEditor value={text} setValue={setText} className={cnNoteEditor('Editor')} />
		</div>
	);
};
