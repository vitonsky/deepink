import React, { FC, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';

import { useTagsRegistry } from '../../Providers';

import { ListItem, TagsList } from './TagsList';

import './NotesOverview.css';

export const cnNotesOverview = cn('NotesOverview');

export type NotesOverviewProps = {};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	const [tags, setTags] = useState<ListItem[]>([]);

	const tagsRegistry = useTagsRegistry();
	useEffect(() => {
		tagsRegistry.get().then((flatTags) => {
			const tagsMap: Record<string, ListItem> = {};
			const tagToParentMap: Record<string, string> = {};

			// Fill maps
			flatTags.forEach(({ id, name, parent }) => {
				tagsMap[id] = {
					id,
					content: name
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
			const nestedTags = Object.values(tagsMap);
			setTags(nestedTags);
		});

		// Run once for init state
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// TODO: show spinner while loading tags
	return (
		<TagsList
			tags={tags}
			onTagClick={(tagId) => {
				console.warn('Click item', tagId);
			}}
		/>
	);
};
