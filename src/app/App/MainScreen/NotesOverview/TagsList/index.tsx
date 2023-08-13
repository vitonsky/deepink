import React, { FC, ReactNode, useState } from 'react';
import { cn } from '@bem-react/classname';

import { Icon } from '../../../../components/Icon/Icon.bundle/common';

import './TagsList.css';

const cnTagsList = cn('TagsList');

// TODO: add id
export type ListItem = {
	content: ReactNode;
	childrens?: ListItem[];
};

export type ITagsListProps = {
	tags: ListItem[];
	onTagClick?: (id: string) => void;
}

export const TagsList: FC<ITagsListProps> = ({ tags, onTagClick }) => {
	const [toggledTags, setToggledTags] = useState<string[]>([]);
	const invertOpenedTags = true;

	return (
		<ul className={cnTagsList()}>
			{tags.map((tag, index) => {
				const tagId = `${index}-${tag.content}`;
				const isGroupOpened = toggledTags.includes(tagId) !== invertOpenedTags;
				return (
					<>
						<li
							className={cnTagsList('Tag')}
							onClick={() => {
								if (onTagClick) {
									onTagClick(tagId);
								}
							}}
						>
							<Icon glyph="tag" />
							<span className={cnTagsList('TagContent')}>
								{tag.content}
							</span>
							<span
								className={cnTagsList('TagControls')}
								onClick={(evt) => {
									evt.stopPropagation();
								}}
							>
								{tag.childrens && (
									<Icon
										glyph="expand-more"
										className={cnTagsList('ExpandButton', { opened: isGroupOpened })}
										onClick={() => {
											setToggledTags((tags) => {
												const isToggled = tags.includes(tagId);

												if (!isToggled) return [...tags, tagId];
												return tags.filter(
													(tag) => tag !== tagId,
												);
											});
										}}
									/>
								)}
							</span>
						</li>
						{tag.childrens && isGroupOpened && (
							<span className={cnTagsList('TagGroup')}>
								<TagsList tags={tag.childrens} />
							</span>
						)}
					</>
				);
			})}
		</ul>
	);
};
