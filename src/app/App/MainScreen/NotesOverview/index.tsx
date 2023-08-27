import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { useStore } from 'effector-react';
import { cn } from '@bem-react/classname';

import { ITag } from '../../../../core/Registry/Tags/Tags';
import { $activeTag, setActiveTag } from '../../../../core/state/notes';
import { Icon } from '../../../components/Icon/Icon.bundle/common';
import { useTagsRegistry } from '../../Providers';

import { List } from './List';
import { TagEditor } from './TagEditor';
import { TagItem, TagsList } from './TagsList';

import './NotesOverview.css';

export const cnNotesOverview = cn('NotesOverview');

export type NotesOverviewProps = {};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	const [tagsTree, setTagsTree] = useState<TagItem[]>([]);
	const [tags, setTags] = useState<ITag[]>([]);

	const activeTag = useStore($activeTag);

	const tagsRegistry = useTagsRegistry();
	const updateTags = useCallback(async () => {
		const flatTags = await tagsRegistry.getTags();

		setTags(flatTags);
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

			const tag = { ...tagsMap[tagId] };
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
		const nestedTags = Object.values(tagsMap);
		setTagsTree(nestedTags);
	}, [tagsRegistry]);

	useEffect(() => {
		updateTags();

		// Run once for init state
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const [isAddTagPopupOpened, setIsAddTagPopupOpened] = useState(false);

	// TODO: show spinner while loading tags
	return (
		<>
			<List
				classNameExtensions={{ ItemBody: cnNotesOverview('MenuItem') }}
				items={[{ id: 'all', content: 'All notes' }]}
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

					<Button view="clear" onPress={() => {
						setIsAddTagPopupOpened(true);
					}}><Icon glyph="add" /></Button>
				</div>

				<TagsList
					tags={tagsTree}
					activeTag={activeTag ?? undefined}
					onTagClick={setActiveTag}
					contextMenu={{
						onDelete(id) {
							console.log('Delete tag', id);
						},
						onEdit(id) {
							console.log('Edit tag', id);
						},
					}}
				/>
			</div>

			{isAddTagPopupOpened && <TagEditor tags={tags} parentTag={tags.length > 0 ? tags[0] : undefined} onSave={async (data) => {
				console.warn('Create tag', data);
				await tagsRegistry.add(data.name, data.parent);
				await updateTags();
				setIsAddTagPopupOpened(false);
			}} onCancel={() => {
				setIsAddTagPopupOpened(false);

			}} />}
		</>
	);
};
