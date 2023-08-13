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
		tagsRegistry.get().then((tags) => {
			// TODO: build tags tree
			console.warn('tags', tags);
			setTags(tags.map(({ id, name }) => ({ id, content: name })));
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
