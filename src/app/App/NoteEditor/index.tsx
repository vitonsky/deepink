import { FC, useEffect, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';

import { IEditableNote } from '../../../core/Note';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import React from 'react';
import { cn } from '@bem-react/classname';

import './NoteEditor.css';

const cnNoteEditor = cn('NoteEditor');

export type NoteEditorProps = {
	note: IEditableNote;
	updateNote: (note: IEditableNote) => void;
};

export const NoteEditor: FC<NoteEditorProps> = ({ note, updateNote }) => {
	const [title, setTitle] = useState(note.title);
	const [text, setText] = useState(note.text);

	// TODO: sync note state with DB
	useEffect(() => {
		updateNote({
			id: note.id,
			title,
			text,
		});
	}, [title, text]);

	return (
		<div className={cnNoteEditor()}>
			<Textinput value={title} onInputText={setTitle} placeholder='Note title' />
			<MonacoEditor
				value={text}
				setValue={setText}
				className={cnNoteEditor('Editor')}
			/>
		</div>
	);
};
