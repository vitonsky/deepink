import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { debounce } from 'lodash';
import { cn } from '@bem-react/classname';

import { findLinksInText, getResourceIdInUrl } from '../../../core/links';
import { INote, INoteData } from '../../../core/Note';
import { ITag } from '../../../core/Registry/Tags/Tags';
import { setActiveTag } from '../../../core/state/notes';
import { Icon } from '../../components/Icon/Icon.bundle/common';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import { NoteScreen } from '../NoteScreen';
import { useAttachmentsRegistry, useFilesRegistry, useTagsRegistry } from '../Providers';

import './NoteEditor.css';

const cnNoteEditor = cn('NoteEditor');

export type NoteEditorProps = {
	note: INote;
	updateNote: (note: INoteData) => void;
};

export const NoteEditor: FC<NoteEditorProps> = ({ note, updateNote }) => {
	const [title, setTitle] = useState(note.data.title);
	const [text, setText] = useState(note.data.text);

	const tagsRegistry = useTagsRegistry();

	const [tags, setTags] = useState<ITag[]>([]);
	const updateTags = useCallback(() => tagsRegistry.getAttachedTags(note.id).then(setTags), [note.id, tagsRegistry]);
	useEffect(() => {
		updateTags();
	}, [note.id, tagsRegistry, updateTags]);

	const updateNoteRef = useRef(updateNote);
	updateNoteRef.current = updateNote;

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedUpdateNote = useCallback(
		debounce((data: { title: string; text: string }) => {
			console.log('Update note in DB');
			updateNoteRef.current(data);
		}, 800),
		[],
	);

	const isFirstRenderRef = useRef(true);
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		debouncedUpdateNote({ title, text });
	}, [title, text, debouncedUpdateNote]);

	const filesRegistry = useFilesRegistry();
	const uploadFile: FileUploader = useCallback(
		async (file) => {
			return filesRegistry.add(file);
		},
		[filesRegistry],
	);

	const attachments = useAttachmentsRegistry();

	// TODO: throttle calls and run in IDLE
	const noteId = note.id;
	const updateAttachments = useCallback(
		(text: string) => {
			// Find ids
			const filesIdRaw = findLinksInText(text).map((link) =>
				getResourceIdInUrl(link.url),
			);

			// Collect unique IDs
			const filesId: string[] = [];
			for (const fileId of filesIdRaw) {
				if (fileId === null) continue;
				if (filesId.includes(fileId)) continue;
				filesId.push(fileId);
			}

			attachments.set(noteId, filesId);
		},
		[attachments, noteId],
	);

	useEffect(() => {
		updateAttachments(text);
	}, [text, updateAttachments]);

	// Immediate update a text
	const onTextUpdate = useCallback(
		(text: string) => {
			debouncedUpdateNote({ title, text });
			debouncedUpdateNote.flush();
			setText(text);
		},
		[debouncedUpdateNote, title],
	);

	return (
		<div className={cnNoteEditor()}>
			<Textinput value={title} onInputText={setTitle} placeholder="Note title" />
			<div className={cnNoteEditor('Attachments')}>
				{tags.map((tag) => (
					<div
						className={cnNoteEditor('Attachment')}
						key={tag.id}
						onClick={() => {
							setActiveTag(tag.id);
						}}
					>
						<span>{tag.resolvedName}</span>
						<Icon
							glyph="clear"
							onClick={async (evt) => {
								evt.stopPropagation();
								console.warn('Remove attached tag', tag.resolvedName);

								const updatedTags = tags.filter(({ id }) => id !== tag.id).map(({ id }) => id);
								await tagsRegistry.setAttachedTags(noteId, updatedTags);
								await updateTags();
							}}
						/>
					</div>
				))}
			</div>
			<div className={cnNoteEditor('SplitContainer')}>
				<MonacoEditor
					value={text}
					setValue={setText}
					className={cnNoteEditor('Editor')}
					uploadFile={uploadFile}
				/>
				<NoteScreen note={note} update={onTextUpdate} />
			</div>
		</div>
	);
};
