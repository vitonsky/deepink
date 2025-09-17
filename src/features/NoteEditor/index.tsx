import React, { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { FaBookmark, FaFlag, FaHashtag, FaXmark } from 'react-icons/fa6';
import { debounce } from 'lodash';
import { Box, Button, Divider, HStack, Input, Tag, Text, VStack } from '@chakra-ui/react';
import { SuggestedTagsList } from '@components/SuggestedTagsList';
import { findLinksInText, getResourceIdInUrl } from '@core/features/links';
import { INote, INoteContent } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import {
	useAttachmentsController,
	useNotesHistory,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectTags, workspacesApi } from '@state/redux/profiles/profiles';

import { BackLinksTree } from './BackLinksTree';
import { NoteEditor } from './NoteEditor';
import { NoteMenu, NoteMenuItems } from './NoteMenuItems';
import { NoteVersions } from './NoteVersions';

export type NoteEditorProps = {
	note: INote;
	updateNote: (note: INoteContent) => void;
};

/**
 * TODO: rename directory of component
 */
export const Note: FC<NoteEditorProps> = memo(({ note, updateNote }) => {
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

	// Snapshot note once
	const noteSnapshotPromiseRef = useRef<null | Promise<void>>(null);
	const noteHistory = useNotesHistory();
	useEffect(() => {
		noteSnapshotPromiseRef.current = new Promise<void>(async (res) => {
			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					await noteHistory.snapshot(note.id);
					res();
					return;
				} catch (err) {
					// Retry after delay
					console.error(err);
					await new Promise((res) => setTimeout(res, 200));
				}
			}
		}).then(() => {
			noteSnapshotPromiseRef.current = null;
		});
	}, [note.id, noteHistory]);

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

		if (noteSnapshotPromiseRef.current === null) {
			debouncedUpdateNote({ title, text });
		} else {
			// Wait note snapshotting before call
			noteSnapshotPromiseRef.current.then(() => {
				debouncedUpdateNote({ title, text });
			});
		}
	}, [title, text, debouncedUpdateNote]);

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

	const [sidePanel, setSidePanel] = useState<NoteMenuItems | null>(null);

	const onNoteMenuClick = useCallback((command: NoteMenuItems) => {
		switch (command) {
			case NoteMenuItems.TOGGLE_BACKLINKS:
			case NoteMenuItems.TOGGLE_HISTORY:
				setSidePanel((state) => (state === command ? null : command));
				break;

			default:
				break;
		}
	}, []);

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
					<NoteMenu onClick={onNoteMenuClick} />
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

			<NoteEditor text={text} setText={setText} />

			{sidePanel === NoteMenuItems.TOGGLE_BACKLINKS && (
				<BackLinksTree onClose={() => setSidePanel(null)} />
			)}
			{sidePanel === NoteMenuItems.TOGGLE_HISTORY && (
				<NoteVersions
					noteId={note.id}
					onClose={() => setSidePanel(null)}
					onVersionApply={(version) => {
						// TODO: apply changes in single transaction + make new snapshot
						setTitle(version.title);
						setText(version.text);
					}}
				/>
			)}
		</VStack>
	);
});

Note.displayName = 'Note';
