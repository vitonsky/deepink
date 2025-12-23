import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
	FaBookmark,
	FaBookOpen,
	FaBoxArchive,
	FaFile,
	FaInbox,
	FaPlus,
	FaTrash,
} from 'react-icons/fa6';
import { Box, Button, Divider, HStack, Text, VStack } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TagEditor, TagEditorData } from '@components/TagEditor';
import { IResolvedTag } from '@core/features/tags';
import {
	TAG_ERROR_CODE,
	TagControllerError,
} from '@core/features/tags/controller/TagsController';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	NOTES_VIEW,
	selectActiveTag,
	selectTags,
	selectTagsTree,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { selectNotesView } from '@state/redux/profiles/selectors/view';

import { TagsList } from './TagsList';

export type NotesOverviewProps = {};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	const telemetry = useTelemetryTracker();

	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const activeTag = useWorkspaceSelector(selectActiveTag);
	const tags = useWorkspaceSelector(selectTags);
	const tagsTree = useWorkspaceSelector(selectTagsTree);

	const notesViewMode = useWorkspaceSelector(selectNotesView);

	const tagsRegistry = useTagsRegistry();

	const parentTagForNewTagRef = useRef<IResolvedTag | null>(null);
	const [isAddTagPopupOpened, setIsAddTagPopupOpened] = useState(false);

	useEffect(() => {
		if (!isAddTagPopupOpened) {
			parentTagForNewTagRef.current = null;
		}
	}, [isAddTagPopupOpened]);

	const [editedTag, setEditedTag] = useState<TagEditorData | null>(null);
	const tagEditor = useMemo(() => {
		if (editedTag) {
			const parent = tags.find(({ id }) => id === editedTag.parent);
			return (
				<TagEditor
					tags={tags}
					parentTag={parent}
					editedTag={editedTag}
					onSave={async (data) => {
						try {
							console.warn('Update tag', data);

							if (data.id === undefined)
								throw new Error('Tag ID is required but not found');

							await tagsRegistry.update({ id: data.id, ...data });
							setEditedTag(null);

							telemetry.track(TELEMETRY_EVENT_NAME.TAG_EDITED, {
								hasParent: data.parent === null ? 'no' : 'yes',
							});

							return { ok: true };
						} catch (error) {
							if (error instanceof TagControllerError) {
								return {
									ok: false,
									error: 'Name of tag for editing cannot create sub tags or be empty',
								};
							}

							throw error;
						}
					}}
					onCancel={() => {
						setEditedTag(null);
					}}
				/>
			);
		}

		if (!isAddTagPopupOpened) return null;

		return (
			<TagEditor
				tags={tags}
				parentTag={parentTagForNewTagRef.current ?? undefined}
				onSave={async (data) => {
					try {
						console.warn('Create tag', data);
						await tagsRegistry.add(data.name, data.parent);
						setIsAddTagPopupOpened(false);

						telemetry.track(TELEMETRY_EVENT_NAME.TAG_CREATED, {
							scope: 'side panel',
							hasParent: data.parent === null ? 'no' : 'yes',
						});

						return { ok: true };
					} catch (error) {
						if (error instanceof TagControllerError) {
							let message: string;
							switch (error.code) {
								case TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST:
									message =
										'Parent tag not found, please select another tag';
									break;
								case TAG_ERROR_CODE.DUPLICATE:
									message = 'Tag already exists';
									break;
								default:
									message =
										'Tag cannot be empty, start or end with "/", or contain "//"';
							}

							return { ok: false, error: message };
						}

						throw error;
					}
				}}
				onCancel={() => {
					setIsAddTagPopupOpened(false);
				}}
			/>
		);
	}, [editedTag, isAddTagPopupOpened, tags, tagsRegistry, telemetry]);

	// TODO: show spinner while loading tags
	return (
		<VStack flex={1} w="100%" gap="2rem" minHeight="0">
			<NestedList
				overflow="auto"
				minHeight="150px"
				items={[
					{
						id: 'inbox',
						content: (
							<HStack padding="0.5rem 1rem" gap="0.8rem">
								<FaInbox />
								<Text>Inbox</Text>
							</HStack>
						),
					},
					{
						id: NOTES_VIEW.All_NOTES,
						content: (
							<HStack padding="0.5rem 1rem" gap="0.8rem">
								<FaBookOpen />
								<Text>All notes</Text>
							</HStack>
						),
					},
					{
						id: 'bookmarks',
						content: (
							<HStack padding="0.5rem 1rem" gap="0.8rem">
								<FaBookmark />
								<Text>Bookmarks</Text>
							</HStack>
						),
					},
					{
						id: 'archive',
						content: (
							<HStack padding="0.5rem 1rem" gap="0.8rem">
								<FaBoxArchive />
								<Text>Archive</Text>
							</HStack>
						),
					},
					{
						id: 'files',
						content: (
							<HStack padding="0.5rem 1rem" gap="0.8rem">
								<FaFile />
								<Text>Files</Text>
							</HStack>
						),
					},
					{
						id: NOTES_VIEW.BIN,
						content: (
							<HStack padding="0.5rem 1rem" gap="0.8rem">
								<FaTrash />
								<Text>Bin</Text>
							</HStack>
						),
					},
				]}
				activeItem={notesViewMode}
				onPick={(id) => {
					if (id !== NOTES_VIEW.All_NOTES && id !== NOTES_VIEW.BIN) return;

					dispatch(
						workspacesApi.setView({
							...workspaceData,
							view: id,
						}),
					);

					dispatch(
						workspacesApi.setSelectedTag({
							...workspaceData,
							tag: null,
						}),
					);
				}}
			/>

			<VStack flex={1} minH="200px" w="100%" align="start">
				<HStack w="100%">
					<Text
						as="h2"
						fontWeight="bold"
						fontSize="16px"
						color="typography.secondary"
					>
						Tags
					</Text>

					<Button
						variant="ghost"
						onClick={() => {
							setIsAddTagPopupOpened(true);
						}}
						size="xs"
						marginLeft="auto"
					>
						<FaPlus />
					</Button>
				</HStack>

				<Divider />

				<Box w="100%" overflow="auto">
					<TagsList
						tags={tagsTree}
						activeTag={activeTag ? activeTag.id : undefined}
						onTagClick={(tagId) =>
							dispatch(
								workspacesApi.setSelectedTag({
									...workspaceData,
									tag: tagId,
								}),
							)
						}
						contextMenu={{
							onAdd(id) {
								const tag = tags.find((tag) => id === tag.id);
								if (tag) {
									parentTagForNewTagRef.current = tag;
								}

								setIsAddTagPopupOpened(true);
							},
							async onDelete(id) {
								const tag = tags.find((tag) => id === tag.id);
								if (!tag) return;

								const isConfirmed = confirm(
									`Really want to delete tag "${tag.resolvedName}" and all sub tags?`,
								);
								if (!isConfirmed) return;

								await tagsRegistry.delete(id);

								telemetry.track(TELEMETRY_EVENT_NAME.TAG_DELETED);
							},
							onEdit(id) {
								const tag = tags.find((tag) => id === tag.id);

								if (!tag) return;

								const { name, parent } = tag;
								setEditedTag({ id, name, parent });
							},
						}}
					/>
				</Box>
			</VStack>

			{tagEditor}
		</VStack>
	);
};
