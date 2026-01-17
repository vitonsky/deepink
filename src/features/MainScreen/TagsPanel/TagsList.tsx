import React, { FC, ReactNode, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronUp, FaHashtag } from 'react-icons/fa6';
import { Button, HStack, Text } from '@chakra-ui/react';
import { ListItem, NestedList } from '@components/NestedList';

import { TagContextMenuCallbacks, useTagContextMenu } from './useTagContextMenu';

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

export const TagsList: FC<ITagsListProps> = ({
	tags,
	activeTag,
	contextMenu,
	onTagClick,
}) => {
	const [toggledTags, setToggledTags] = useState<string[]>([]);

	const onTagMenu = useTagContextMenu(contextMenu);

	const items: ListItem[] = useMemo(() => {
		return convertTagToListItem(tags, ({ id, content, childrens }) => {
			const isToggledGroup = toggledTags.includes(id);
			const isOpenedGroup = !isToggledGroup;
			const isHaveChilds = childrens !== undefined && childrens.length > 0;

			return {
				id,
				content: (
					<HStack
						w="100%"
						align="start"
						gap="0.5rem"
						padding="0.4rem"
						alignItems="center"
						onContextMenu={(evt) => {
							onTagMenu(id, { x: evt.clientX, y: evt.clientY });
						}}
					>
						<FaHashtag size={14} />

						<Text overflow="hidden" textOverflow="ellipsis">
							{content}
						</Text>

						{isHaveChilds ? (
							<Button
								marginLeft="auto"
								padding="2px"
								variant="ghost"
								boxSize="1rem"
								minWidth={0}
								tabIndex={-1}
								sx={{
									borderRadius: '4px',
								}}
								onClick={(evt) => {
									evt.stopPropagation();
									setToggledTags((tags) => {
										if (isOpenedGroup) return [...tags, id];
										return tags.filter((tag) => tag !== id);
									});
								}}
							>
								{isOpenedGroup ? (
									<FaChevronUp size={14} />
								) : (
									<FaChevronDown size={14} />
								)}
							</Button>
						) : undefined}
					</HStack>
				),
				collapsed: !isOpenedGroup,
			};
		});
	}, [onTagMenu, tags, toggledTags]);

	return <NestedList items={items} activeItem={activeTag} onPick={onTagClick} />;
};
