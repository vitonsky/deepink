import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';
import { Box, Button, Divider, HStack, Text, VStack } from '@chakra-ui/react';
import { TagEditor, TagEditorData } from '@components/TagEditor';
import { IResolvedTag } from '@core/features/tags';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveTag,
	selectTags,
	selectTagsTree,
	workspacesApi,
} from '@state/redux/profiles/profiles';

import { TagsList } from './TagsList';

export const TagsBar = () => {
	const telemetry = useTelemetryTracker();

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

						telemetry.track(TELEMETRY_EVENT_NAME.TAG_EDITED, {
							hasParent: data.parent === null ? 'no' : 'yes',
						});
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

					telemetry.track(TELEMETRY_EVENT_NAME.TAG_CREATED, {
						scope: 'side panel',
						hasParent: data.parent === null ? 'no' : 'yes',
					});
				}}
				onCancel={() => {
					setIsAddTagPopupOpened(false);
				}}
			/>
		);
	}, [editedTag, isAddTagPopupOpened, tags, tagsRegistry, telemetry]);

	return (
		<>
			<VStack w="100%" align="start" overflow="hidden" minHeight="150px">
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
					{tagsTree.length > 0 ? (
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
					) : (
						<Text color="typography.secondary" fontSize="sm">
							Add tags in this workspace to organize notes
						</Text>
					)}
				</Box>
			</VStack>

			{tagEditor}
		</>
	);
};
