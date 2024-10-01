import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useDetectClickOutside } from 'react-detect-click-outside';
import { Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { Popup } from 'react-elegant-ui/esm/components/Popup/Popup.bundle/desktop';
import {
	FaBell,
	FaBookmark,
	FaBoxArchive,
	FaClock,
	FaCopy,
	FaDownload,
	FaEllipsis,
	FaEye,
	FaFileExport,
	FaFlag,
	FaLink,
	FaRotate,
	FaShield,
	FaSpellCheck,
	FaTrashCan,
	FaXmark,
} from 'react-icons/fa6';
import { debounce } from 'lodash';
import { cn } from '@bem-react/classname';
import { Box, Button, Divider, HStack, Input, Tag, Text } from '@chakra-ui/react';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Stack } from '@components/Stack/Stack';
import { SuggestedTagsList } from '@components/SuggestedTagsList';
import { findLinksInText, getResourceIdInUrl } from '@core/features/links';
import { INote, INoteContent } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import {
	useAttachmentsController,
	useFilesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectTags, workspacesApi } from '@state/redux/profiles/profiles';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import { NoteScreen } from '../NoteScreen';

import './NoteEditor.css';

const cnNoteEditor = cn('NoteEditor');

export type NoteEditorProps = {
	note: INote;
	updateNote: (note: INoteContent) => void;
};

export const NoteEditor: FC<NoteEditorProps> = ({ note, updateNote }) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const [title, setTitle] = useState(note.content.title);
	const [text, setText] = useState(note.content.text);

	const tagsRegistry = useTagsRegistry();

	const tags = useWorkspaceSelector(selectTags);

	const [notAttachedTags, setNotAttachedTags] = useState<IResolvedTag[]>([]);
	const [attachedTags, setAttachedTags] = useState<IResolvedTag[]>([]);
	const updateTags = useCallback(async () => {
		const attachedTags = await tagsRegistry.getAttachedTags(note.id);
		setAttachedTags(attachedTags);

		const filteredAttachedTags = tags.filter(
			({ id }) => !attachedTags.some((attachedTag) => attachedTag.id === id),
		);
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

	const attachments = useAttachmentsController();

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

	// TODO: create hook for boilerplate for trigger
	const noteControlButtonRef = useRef<HTMLButtonElement | null>(null);
	const [isNoteMenuOpened, setIsNoteMenuOpened] = useState(false);

	const ref = useDetectClickOutside({ onTriggered: () => setIsNoteMenuOpened(false) });

	const [sidePanel, setSidePanel] = useState<string | null>(null);

	return (
		<div className={cnNoteEditor()}>
			<HStack w="100%" align="start">
				<HStack w="100%" align="start">
					<Input
						placeholder="Note title"
						size="sm"
						borderRadius="6px"
						value={title}
						onChange={(evt) => setTitle(evt.target.value)}
					/>

					<Button
						ref={noteControlButtonRef}
						variant="primary"
						size="sm"
						onClick={() => setIsNoteMenuOpened((state) => !state)}
					>
						<FaEllipsis />
					</Button>
				</HStack>

				{/* TODO: add options that may be toggled */}
				{/* TODO: render popups in portal */}
				<Popup
					target="anchor"
					anchor={noteControlButtonRef}
					view="default"
					visible={isNoteMenuOpened}
					zIndex={99}
					boundary={{ current: document.body }}
					innerRef={ref}
				>
					<Menu
						items={[
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaCopy />
										</Icon>
										<span>Copy reference on note</span>
									</Stack>
								),
								textContent: 'Copy reference on note',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaBell />
										</Icon>
										<span>Remind me</span>
									</Stack>
								),
								textContent: 'Remind me',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaClock />
										</Icon>
										<span>History</span>
									</Stack>
								),
								textContent: 'History',
							},
							{
								id: 'backlinks',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaLink />
										</Icon>
										<span>Back links</span>
									</Stack>
								),
								textContent: 'Back links',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaEye />
										</Icon>
										<span>Readonly mode</span>
									</Stack>
								),
								textContent: 'Read-only mode',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaDownload />
										</Icon>
										<span>Download and convert a network media</span>
									</Stack>
								),
								textContent: 'Download and convert a network media',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaSpellCheck />
										</Icon>
										<span>Spellcheck</span>
									</Stack>
								),
								textContent: 'Spellcheck',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaFileExport />
										</Icon>
										<span>Export...</span>
									</Stack>
								),
								textContent: 'Export...',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaShield />
										</Icon>
										<span>Password protection...</span>
									</Stack>
								),
								textContent: 'Password protection...',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaRotate />
										</Icon>
										<span>Disable sync</span>
									</Stack>
								),
								textContent: 'Disable sync',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaBoxArchive />
										</Icon>
										<span>Archive</span>
									</Stack>
								),
								textContent: 'Archive',
							},
							{
								id: 'id',
								content: (
									<Stack direction="horizontal" spacing={4}>
										<Icon hasGlyph boxSize="1rem">
											<FaTrashCan />
										</Icon>
										<span>Delete</span>
									</Stack>
								),
								textContent: 'Delete',
							},
						]}
						onPick={(id) => {
							console.log('pick menu', id);
							if (id === 'backlinks') {
								setSidePanel('backlinks');
							}

							setIsNoteMenuOpened(false);
						}}
					/>
				</Popup>
			</HStack>

			<Box alignItems="center" className={cnNoteEditor('Attachments')}>
				<Stack direction="horizontal">
					<Button variant="ghost" size="xs">
						<FaBookmark />
					</Button>
					<Button variant="ghost" size="xs">
						<FaFlag />
					</Button>
				</Stack>

				<Divider orientation="vertical" h="1em" />

				{attachedTags.map((tag) => (
					<Tag
						as={HStack}
						key={tag.id}
						height="fit-content"
						onClick={() => {
							dispatch(
								workspacesApi.setSelectedTag({
									...workspaceData,
									tag: tag.id,
								}),
							);
						}}
					>
						<Text>{tag.resolvedName}</Text>
						<Box
							sx={{
								'&:not(:hover)': {
									opacity: '.6',
								},
							}}
						>
							<FaXmark
								onClick={async (evt) => {
									evt.stopPropagation();
									console.warn('Remove attached tag', tag.resolvedName);

									const updatedTags = attachedTags
										.filter(({ id }) => id !== tag.id)
										.map(({ id }) => id);
									await tagsRegistry.setAttachedTags(
										noteId,
										updatedTags,
									);
									await updateTags();
								}}
							/>
						</Box>
					</Tag>
				))}

				<Input
					type="text"
					ref={tagInputRef}
					size="xs"
					variant="ghost"
					w="auto"
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
			</Box>

			<div className={cnNoteEditor('SplitContainer')}>
				<MonacoEditor
					value={text}
					setValue={setText}
					className={cnNoteEditor('Editor')}
					uploadFile={uploadFile}
				/>
				<NoteScreen note={note} update={onTextUpdate} />
			</div>

			{sidePanel === 'backlinks' && (
				<div className={cnNoteEditor('SideBar')}>
					<div className={cnNoteEditor('SideBarHead')}>
						<Button
							variant="ghost"
							size="s"
							onClick={() => setSidePanel(null)}
						>
							<Icon hasGlyph scalable boxSize=".8rem">
								<FaXmark />
							</Icon>
						</Button>
					</div>

					<div className={cnNoteEditor('SideBarBody')}>
						TODO: Note related data here
					</div>
				</div>
			)}

			{isShowTagsList && (
				<Popup
					target="anchor"
					anchor={tagInputRef}
					view="default"
					visible
					direction={['bottom-start', 'bottom', 'bottom-end']}
				>
					<SuggestedTagsList
						tags={notAttachedTags}
						tagName={attachTagName}
						hasTagName={(tagName) =>
							tags.some(({ resolvedName }) => resolvedName === tagName)
						}
						onPickTag={async (id) => {
							// tagInputRef.current?.blur();
							setAttachTagName('');
							await tagsRegistry.setAttachedTags(noteId, [
								...attachedTags.map(({ id }) => id),
								id,
							]);

							await updateTags();
						}}
						onCreateTag={async (tagName) => {
							setAttachTagName('');

							let shortenedTagName = tagName;
							let parentTagId: string | null = null;
							const tagSegments = tagName.split('/');
							for (
								let lastSegmentIndex = tagSegments.length - 1;
								lastSegmentIndex > 0;
								lastSegmentIndex--
							) {
								const resolvedParentTag = tagSegments
									.slice(0, lastSegmentIndex)
									.join('/');
								const foundTag = tags.find(
									({ resolvedName }) =>
										resolvedName === resolvedParentTag,
								);
								if (foundTag) {
									parentTagId = foundTag.id;
									shortenedTagName = tagSegments
										.slice(lastSegmentIndex)
										.join('/');
									break;
								}
							}

							const tagId = await tagsRegistry.add(
								shortenedTagName,
								parentTagId,
							);
							await tagsRegistry.setAttachedTags(noteId, [
								...attachedTags.map(({ id }) => id),
								tagId,
							]);

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
