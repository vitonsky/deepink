import React, { FC, ReactNode, useMemo, useState } from 'react';
import { cn } from '@bem-react/classname';

import { Icon } from '../../../../components/Icon/Icon.bundle/common';

import { List, ListItem } from '../List';
import { TagContextMenuCallbacks, useTagContextMenu } from './useTagContextMenu';

import './TagsList.css';

const cnTagsList = cn('TagsList');

export type TagItem = {
	id: string;
	content: ReactNode;
	childrens?: TagItem[];
};

export type ITagsListProps = {
	tags: TagItem[];
	activeTag?: string;
	onTagClick?: (id: string) => void;
	contextMenu: TagContextMenuCallbacks;
};

const convertTagToListItem = (
	tags: TagItem[],
	mapper: (tag: TagItem) => ListItem,
): ListItem[] =>
	tags.map((tag) => {
		const { childrens } = tag;

		const listItem = mapper(tag);

		// Overwrite childs
		if (childrens) {
			listItem.childrens = convertTagToListItem(childrens, mapper);
		}
		return listItem;
	});

export const TagsList: FC<ITagsListProps> = ({ tags, activeTag, contextMenu, onTagClick }) => {
	const [toggledTags, setToggledTags] = useState<string[]>([]);

	const onTagMenu = useTagContextMenu(contextMenu);

	const items: ListItem[] = useMemo(() => {
		return convertTagToListItem(tags, ({ id, content, childrens }) => {
			const isToggledGroup = toggledTags.includes(id);
			const isOpenedGroup = !isToggledGroup;

			return {
				id,
				content: (
					<div className={cnTagsList('Tag')} onContextMenu={(evt) => {
						onTagMenu(id, { x: evt.clientX, y: evt.clientY });
					}}>
						<Icon glyph="tag" />

						<span className={cnTagsList('TagContent')}>{content}</span>

						<span
							className={cnTagsList('TagControls')}
							onClick={(evt) => {
								evt.stopPropagation();
							}}
						>
							{childrens && childrens.length > 0 && (
								<Icon
									glyph="expand-more"
									className={cnTagsList('ExpandButton', {
										opened: isOpenedGroup,
									})}
									onClick={() => {
										setToggledTags((tags) => {
											if (isOpenedGroup) return [...tags, id];
											return tags.filter((tag) => tag !== id);
										});
									}}
								/>
							)}
						</span>
					</div>
				),
				collapsed: !isOpenedGroup,
			};
		});
	}, [onTagMenu, tags, toggledTags]);

	return (
		<div className={cnTagsList()}>
			<List items={items} activeItem={activeTag} onPick={onTagClick} />
		</div>
	);
};
