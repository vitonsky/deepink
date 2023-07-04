import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INoteData } from '../../../core/Note';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';

import './NoteEditor.css';

const cnNoteEditor = cn('NoteEditor');

export type NoteEditorProps = {
	note: INoteData;
	updateNote: (note: INoteData) => void;
};

export const NoteEditor: FC<NoteEditorProps> = ({ note, updateNote }) => {
	const [title, setTitle] = useState(note.title);
	const [text, setText] = useState(note.text);

	const updateNoteRef = useRef(updateNote);
	updateNoteRef.current = updateNote;

	const isFirstRenderRef = useRef(true);
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		updateNoteRef.current({ title, text });
	}, [title, text]);

	const uploadFile: FileUploader = useCallback(async (file) => {
		// TODO: implement logic
		console.log('Upload file...', file);
	}, []);

	return (
		<div className={cnNoteEditor()}>
			<Textinput value={title} onInputText={setTitle} placeholder="Note title" />
			<MonacoEditor
				value={text}
				setValue={setText}
				className={cnNoteEditor('Editor')}
				uploadFile={uploadFile}
			/>
		</div>
	);
};
