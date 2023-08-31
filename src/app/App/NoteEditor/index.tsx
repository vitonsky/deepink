import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Popup } from 'react-elegant-ui/esm/components/Popup/Popup.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { useStore } from 'effector-react';
import { debounce } from 'lodash';
import { cn } from '@bem-react/classname';

import { findLinksInText, getResourceIdInUrl } from '../../../core/links';
import { INote, INoteData } from '../../../core/Note';
import { ITag } from '../../../core/Registry/Tags/Tags';
import { $tags, setActiveTag, tagAttachmentsChanged, tagsChanged } from '../../../core/state/tags';
import { Icon } from '../../components/Icon/Icon.bundle/common';

import { TagsList } from '../MainScreen/NotesOverview/TagEditor/TagsList';
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

	const tags = useStore($tags);
	const [notAttachedTags, setNotAttachedTags] = useState<ITag[]>([]);
	const [attachedTags, setAttachedTags] = useState<ITag[]>([]);
	const updateTags = useCallback(async () => {
		const attachedTags = await tagsRegistry.getAttachedTags(note.id);
		setAttachedTags(attachedTags);

		const filteredAttachedTags = tags.filter(({ id }) => !attachedTags.some((attachedTag) => attachedTag.id === id));
		setNotAttachedTags(filteredAttachedTags);
	}, [note.id, tags, tagsRegistry]);
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

	const [attachTagName, setAttachTagName] = useState('');
	const [isShowTagsList, setIsShowTagsList] = useState(false);
	const tagInputRef = useRef<HTMLInputElement | null>(null);

	return (
		<div className={cnNoteEditor()}>
			<Textinput value={title} onInputText={setTitle} placeholder="Note title" />
			<div className={cnNoteEditor('Attachments')}>
				{attachedTags.map((tag) => (
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

								const updatedTags = attachedTags
									.filter(({ id }) => id !== tag.id)
									.map(({ id }) => id);
								await tagsRegistry.setAttachedTags(noteId, updatedTags);
								tagAttachmentsChanged([{
									tagId: tag.id,
									target: noteId,
									state: 'delete'
								}]);
								await updateTags();
							}}
						/>
					</div>
				))}

				<input
					type="text"
					ref={tagInputRef}
					className={cnNoteEditor('AttachmentInput')}
					placeholder="Add some tags..."
					value={attachTagName}
					onChange={(evt) => {
						setAttachTagName(evt.target.value);
					}}
					onFocus={() => {
						setIsShowTagsList(true);
					}}
					onBlur={() => {
						setIsShowTagsList(false);
						setAttachTagName('');
					}}
				/>
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
			{isShowTagsList && (
				<Popup
					target="anchor"
					anchor={tagInputRef}
					view="default"
					visible
					direction={['bottom-start', 'bottom', 'bottom-end']}
				// boundary={modalRef}
				>
					<TagsList
						tags={notAttachedTags}
						tagName={attachTagName}
						hasTagName={(tagName) => tags.some(({ resolvedName }) => resolvedName === tagName)}
						onPickTag={async (id) => {
							// tagInputRef.current?.blur();
							setAttachTagName('');
							await tagsRegistry.setAttachedTags(noteId, [...attachedTags.map(({ id }) => id), id]);
							tagAttachmentsChanged([{
								tagId: id,
								target: noteId,
								state: 'add'
							}]);

							await updateTags();
						}}
						onCreateTag={async (tagName) => {
							setAttachTagName('');

							let cuttedTagName = tagName;
							let parentTagId: string | null = null;
							const tagSegments = tagName.split('/');
							for (let segmentsNum = tagSegments.length - 1; segmentsNum > 0; segmentsNum--) {
								const resolvedParentTag = tagSegments.slice(0, segmentsNum).join('/');
								const foundTag = tags.find(({ resolvedName }) => resolvedName === resolvedParentTag);
								if (foundTag) {
									parentTagId = foundTag.id;
									cuttedTagName = tagSegments.slice(segmentsNum).join('/');
									break;
								}
							}

							const tagId = await tagsRegistry.add(cuttedTagName, parentTagId);
							tagsChanged();
							await tagsRegistry.setAttachedTags(noteId, [...attachedTags.map(({ id }) => id), tagId]);
							tagAttachmentsChanged([{
								tagId: tagId,
								target: noteId,
								state: 'add'
							}]);

							await updateTags();
						}}
						onMouseDownCapture={(evt) => {
							evt.preventDefault();
							evt.stopPropagation();
						}}
					/>
				</Popup>
			)}
		</div>
	);
};
