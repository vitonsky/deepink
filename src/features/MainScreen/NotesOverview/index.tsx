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
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveTag,
	selectTags,
	selectTagsTree,
	workspacesApi,
} from '@state/redux/profiles/profiles';

import { TagsList } from './TagsList';

export type NotesOverviewProps = {};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const activeTag = useWorkspaceSelector(selectActiveTag);
	const tags = useWorkspaceSelector(selectTags);
	const tagsTree = useWorkspaceSelector(selectTagsTree);

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
						console.warn('Update tag', data);

						if (data.id === undefined) return;

						await tagsRegistry.update({ id: data.id, ...data });
						setEditedTag(null);
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
					console.warn('Create tag', data);
					await tagsRegistry.add(data.name, data.parent);
					setIsAddTagPopupOpened(false);
				}}
				onCancel={() => {
					setIsAddTagPopupOpened(false);
				}}
			/>
		);
	}, [editedTag, isAddTagPopupOpened, tags, tagsRegistry]);

	// TODO: show spinner while loading tags
	return (
		<VStack flex={1} w="100%" gap="2rem" overflow="hidden">
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
						id: 'all',
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
						id: 'bin',
						content: (
							<HStack padding="0.5rem 1rem" gap="0.8rem">
								<FaTrash />
								<Text>Bin</Text>
							</HStack>
						),
					},
				]}
				activeItem={activeTag === null ? 'all' : undefined}
				onPick={(id) => {
					if (id === 'all') {
						dispatch(
							workspacesApi.setSelectedTag({
								...workspaceData,
								tag: null,
							}),
						);
					}
				}}
			/>

			<VStack flex={1} minH="200px" w="100%" align="start" overflow="hidden">
				<HStack w="100%">
					<Text as="h2" fontWeight="bold" fontSize="16px" color="#4c4c4c">
						Tags
					</Text>

					<Button
						variant="ghost"
						onClick={() => {
							setIsAddTagPopupOpened(true);
						}}
						size="sm"
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
								console.log('Delete tag', id);

								const tag = tags.find((tag) => id === tag.id);
								if (!tag) return;

								const isConfirmed = confirm(
									`Really want to delete tag "${tag.resolvedName}" and all sub tags?`,
								);
								if (!isConfirmed) return;

								await tagsRegistry.delete(id);
							},
							onEdit(id) {
								console.log('Edit tag', id);

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
