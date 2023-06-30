import { FC, useEffect, useRef, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';

import { INoteData } from '../../../core/Note';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import React from 'react';
import { cn } from '@bem-react/classname';

import './NoteEditor.css';

const cnNoteEditor = cn('NoteEditor');

export type NoteEditorProps = {
	note: INoteData;
	updateNote: (note: INoteData) => void;
};

export const NoteEditor: FC<NoteEditorProps> = ({ note, updateNote }) => {
	const [title, setTitle] = useState(note.title);
	const [text, setText] = useState(note.text);

	const isFirstRenderRef = useRef(true);
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		updateNote({ title, text });
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
