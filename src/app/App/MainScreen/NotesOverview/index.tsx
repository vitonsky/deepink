import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import {
	FaBookmark,
	FaBookOpen,
	FaBoxArchive,
	FaFile,
	FaInbox,
	FaTrash,
} from 'react-icons/fa6';
import { useStore, useStoreMap } from 'effector-react';
import { cn } from '@bem-react/classname';

import {
	$activeTag,
	$tags,
	setActiveTag,
	tagsChanged,
} from '../../../../core/state/tags';
import { ITag } from '../../../../core/storage/controllers/tags/TagsController';
import { Icon } from '../../../components/Icon/Icon.bundle/common';
import { List } from '../../../components/List';
import { TagEditor, TagEditorData } from '../../../components/TagEditor';
import { useTagsRegistry } from '../../Providers';

import { TagItem, TagsList } from './TagsList';

import './NotesOverview.css';

export const cnNotesOverview = cn('NotesOverview');

export type NotesOverviewProps = {};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	const activeTag = useStore($activeTag);

	const tags = useStore($tags);
	const tagsTree = useStoreMap($tags, (flatTags) => {
		const tagsMap: Record<string, TagItem> = {};
		const tagToParentMap: Record<string, string> = {};

		// Fill maps
		flatTags.forEach(({ id, name, parent }) => {
			tagsMap[id] = {
				id,
				content: name,
			};

			if (parent !== null) {
				tagToParentMap[id] = parent;
			}
		});

		// Attach tags to parents
		for (const tagId in tagToParentMap) {
			const parentId = tagToParentMap[tagId];

			const tag = tagsMap[tagId];
			const parentTag = tagsMap[parentId];

			// Create array
			if (!parentTag.childrens) {
				parentTag.childrens = [];
			}

			// Attach tag to another tag
			parentTag.childrens.push(tag);
		}

		// Delete nested tags from tags map
		Object.keys(tagToParentMap).forEach((nestedTagId) => {
			delete tagsMap[nestedTagId];
		});

		// Collect tags array from a map
		return Object.values(tagsMap);
	});

	const tagsRegistry = useTagsRegistry();
	const updateTags = tagsChanged;

	useEffect(() => {
		updateTags();

		// Run once for init state
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const parentTagForNewTagRef = useRef<ITag | null>(null);
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
						await updateTags();
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
					await updateTags();
					setIsAddTagPopupOpened(false);
				}}
				onCancel={() => {
					setIsAddTagPopupOpened(false);
				}}
			/>
		);
	}, [editedTag, isAddTagPopupOpened, tags, tagsRegistry, updateTags]);

	// TODO: show spinner while loading tags
	return (
		<>
			<List
				classNameExtensions={{ ItemBody: cnNotesOverview('MenuItem') }}
				items={[
					{
						id: 'inbox',
						content: (
							<>
								<Icon hasGlyph boxSize=".9rem">
									<FaInbox size="100%" />
								</Icon>{' '}
								<span>Inbox</span>
							</>
						),
					},
					{
						id: 'all',
						content: (
							<>
								<Icon hasGlyph boxSize=".9rem">
									<FaBookOpen size="100%" />
								</Icon>{' '}
								<span>All notes</span>
							</>
						),
					},
					{
						id: 'bookmarks',
						content: (
							<>
								<Icon hasGlyph boxSize=".9rem">
									<FaBookmark size="100%" />
								</Icon>{' '}
								<span>Bookmarks</span>
							</>
						),
					},
					{
						id: 'archive',
						content: (
							<>
								<Icon hasGlyph boxSize=".9rem">
									<FaBoxArchive size="100%" />
								</Icon>{' '}
								<span>Archive</span>
							</>
						),
					},
					{
						id: 'files',
						content: (
							<>
								<Icon hasGlyph boxSize=".9rem">
									<FaFile size="100%" />
								</Icon>{' '}
								<span>Files</span>
							</>
						),
					},
					{
						id: 'bin',
						content: (
							<>
								<Icon hasGlyph boxSize=".9rem">
									<FaTrash size="100%" />
								</Icon>{' '}
								<span>Bin</span>
							</>
						),
					},
				]}
				activeItem={activeTag === null ? 'all' : undefined}
				onPick={(id) => {
					if (id === 'all') {
						setActiveTag(null);
					}
				}}
			/>

			<div className={cnNotesOverview('Tags')}>
				<div className={cnNotesOverview('TagsControls')}>
					<h2>Tags</h2>

					<Button
						view="clear"
						onPress={() => {
							setIsAddTagPopupOpened(true);
						}}
						size="s"
					>
						<Icon glyph="add" scalable />
					</Button>
				</div>

				<div className={cnNotesOverview('TagsList')}>
					<TagsList
						tags={tagsTree}
						activeTag={activeTag ?? undefined}
						onTagClick={setActiveTag}
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
								updateTags();
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
				</div>
			</div>

			{tagEditor}
		</>
	);
};
