import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cn } from '@bem-react/classname';

import { findLinksInText, getResourceIdInUrl } from '../../../core/links';
import { INote, INoteData } from '../../../core/Note';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import { useAttachmentsRegistry, useFilesRegistry } from '../Providers';

import './NoteEditor.css';

const cnNoteEditor = cn('NoteEditor');

export type NoteEditorProps = {
	note: INote;
	updateNote: (note: INoteData) => void;
};

export const NoteEditor: FC<NoteEditorProps> = ({ note, updateNote }) => {
	const [title, setTitle] = useState(note.data.title);
	const [text, setText] = useState(note.data.text);

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

	const filesRegistry = useFilesRegistry();
	const uploadFile: FileUploader = useCallback(async (file) => {
		return filesRegistry.add(file);
	}, [filesRegistry]);

	const attachments = useAttachmentsRegistry();

	// TODO: throttle calls and run in IDLE
	const noteId = note.id;
	const updateAttachments = useCallback((text: string) => {
		// Find ids
		const filesIdRaw = findLinksInText(text).map((link) => getResourceIdInUrl(link.url));

		// Collect unique IDs
		const filesId: string[] = [];
		for (const fileId of filesIdRaw) {
			if (fileId === null) continue;
			if (filesId.includes(fileId)) continue;
			filesId.push(fileId);
		}

		attachments.set(noteId, filesId);
	}, [attachments, noteId]);

	useEffect(() => {
		updateAttachments(text);
	}, [text, updateAttachments]);

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
