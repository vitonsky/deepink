import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
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
import {
	Box,
	Button,
	Divider,
	HStack,
	Input,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tag,
	Text,
	VStack,
} from '@chakra-ui/react';
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

					{/* TODO: add options that may be toggled */}
					<Menu>
						<MenuButton as={Button} variant="primary" size="sm">
							<FaEllipsis />
						</MenuButton>
						<MenuList>
							<MenuItem>
								<HStack>
									<FaCopy />
									<Text>Copy reference on note</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaBell />
									<Text>Remind me</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaClock />
									<Text>History</Text>
								</HStack>
							</MenuItem>
							<MenuItem onClick={() => setSidePanel('backlinks')}>
								<HStack>
									<FaLink />
									<Text>Back links</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaEye />
									<Text>Readonly mode</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaDownload />
									<Text>Download and convert a network media</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaSpellCheck />
									<Text>Spellcheck</Text>
								</HStack>
							</MenuItem>

							<MenuItem>
								<HStack>
									<FaFileExport />
									<Text>Export...</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaShield />
									<Text>Password protection...</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaRotate />
									<Text>Disable sync</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaBoxArchive />
									<Text>Archive</Text>
								</HStack>
							</MenuItem>
							<MenuItem>
								<HStack>
									<FaTrashCan />
									<Text>Delete</Text>
								</HStack>
							</MenuItem>
						</MenuList>
					</Menu>
				</HStack>
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

				<Popover
					isOpen={isShowTagsList}
					autoFocus={false}
					closeOnBlur={false}
					returnFocusOnClose={false}
				>
					<PopoverTrigger>
						<Input
							type="text"
							ref={tagInputRef}
							size="xs"
							variant="ghost"
							w="auto"
							placeholder="Add some tags..."
							value={attachTagName}
							onKeyDown={(evt) => {
								if (evt.key === 'Escape') {
									setIsShowTagsList(false);
									setAttachTagName('');
									return;
								}

								setIsShowTagsList(true);
							}}
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
					</PopoverTrigger>
					<PopoverContent>
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
					</PopoverContent>
				</Popover>
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
				<VStack
					align="start"
					w="100%"
					h="300px"
					padding=".5rem"
					gap="1rem"
					borderTop="1px solid #e2e8f0"
				>
					<HStack w="100%">
						<Text fontWeight="bold">Back links tree</Text>
						<Button
							variant="ghost"
							size="xs"
							marginLeft="auto"
							onClick={() => setSidePanel(null)}
						>
							<FaXmark />
						</Button>
					</HStack>

					<Box w="100%">TODO: Note related data here</Box>
				</VStack>
			)}
		</div>
	);
};
