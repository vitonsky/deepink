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
	FaHashtag,
	FaLink,
	FaRotate,
	FaShield,
	FaSpellCheck,
	FaTrashCan,
	FaXmark,
} from 'react-icons/fa6';
import { debounce } from 'lodash';
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
	Tag,
	Text,
	VStack,
} from '@chakra-ui/react';
import { SuggestedTagsList } from '@components/SuggestedTagsList';
import { findLinksInText, getResourceIdInUrl } from '@core/features/links';
import { INote, INoteContent } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import {
	useAttachmentsController,
	useFilesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectTags, workspacesApi } from '@state/redux/profiles/profiles';
import { selectEditorMode } from '@state/redux/settings/settings';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import { EditorPanelContext } from './EditorPanel';
import { EditorPanel } from './EditorPanel/EditorPanel';
import { RichEditor } from './RichEditor/RichEditor';

export type NoteEditorProps = {
	note: INote;
	updateNote: (note: INoteContent) => void;
};

export const NoteEditor: FC<NoteEditorProps> = ({ note, updateNote }) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const editorMode = useAppSelector(selectEditorMode);

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

	const [attachTagName, setAttachTagName] = useState<IResolvedTag | null>(null);
	const [tagSearch, setTagSearch] = useState(
		attachTagName ? attachTagName.resolvedName : '',
	);

	const [sidePanel, setSidePanel] = useState<string | null>(null);

	return (
		<VStack w="100%" align="start">
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

			<HStack alignItems="center" w="100%" flexWrap="wrap">
				<HStack>
					<Button variant="ghost" size="xs">
						<FaBookmark />
					</Button>
					<Button variant="ghost" size="xs">
						<FaFlag />
					</Button>
				</HStack>

				<Divider orientation="vertical" h="1em" />

				{attachedTags.map((tag) => (
					<Tag
						as={HStack}
						key={tag.id}
						height="fit-content"
						gap=".4rem"
						onClick={() => {
							dispatch(
								workspacesApi.setSelectedTag({
									...workspaceData,
									tag: tag.id,
								}),
							);
						}}
						sx={{ cursor: 'pointer' }}
					>
						<HStack gap=".2rem">
							<FaHashtag />
							<Text>{tag.resolvedName}</Text>
						</HStack>
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

				<SuggestedTagsList
					tags={notAttachedTags}
					selectedTag={attachTagName ?? undefined}
					inputValue={tagSearch}
					onInputChange={setTagSearch}
					sx={{
						display: 'inline',
						w: 'auto',
						maxW: '150px',
					}}
					inputProps={{
						variant: 'ghost',
						placeholder: 'Add some tags...',
						// size: 'sm',
						size: 'xs',
					}}
					hasTagName={(tagName) =>
						tags.some(({ resolvedName }) => resolvedName === tagName)
					}
					onPick={async (tag) => {
						setAttachTagName(tag);
						await tagsRegistry.setAttachedTags(noteId, [
							...attachedTags.map(({ id }) => id),
							tag.id,
						]);

						setTagSearch('');

						await updateTags();
					}}
					onCreateTag={async (tagName) => {
						setAttachTagName(null);

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
								({ resolvedName }) => resolvedName === resolvedParentTag,
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
				/>
			</HStack>

			<EditorPanelContext>
				<HStack align="start" w="100%" overflowX="auto" flexShrink={0}>
					<EditorPanel />
				</HStack>

				<HStack
					sx={{
						display: 'flex',
						width: '100%',
						height: '100%',
						overflow: 'hidden',
					}}
				>
					{(editorMode === 'plaintext' || editorMode === 'split-screen') && (
						<Box
							as={MonacoEditor}
							value={text}
							setValue={setText}
							flexGrow="100"
							uploadFile={uploadFile}
							width="100%"
							height="100%"
						/>
					)}
					{(editorMode === 'richtext' || editorMode === 'split-screen') && (
						<RichEditor
							placeholder="Write your thoughts here..."
							value={text}
							onChanged={setText}
						/>
					)}
				</HStack>
			</EditorPanelContext>

			{sidePanel === 'backlinks' && (
				<VStack
					align="start"
					w="100%"
					h="300px"
					flex={1}
					padding=".5rem"
					gap="1rem"
					borderTop="1px solid"
					borderColor="surface.border"
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
		</VStack>
	);
};
