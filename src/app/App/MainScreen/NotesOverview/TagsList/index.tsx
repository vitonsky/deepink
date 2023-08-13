import React, { FC, ReactNode, useState } from 'react';
import { cn } from '@bem-react/classname';

import { Icon } from '../../../../components/Icon/Icon.bundle/common';

import './TagsList.css';

const cnTagsList = cn('TagsList');

// TODO: add id
export type ListItem = {
	id: string;
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
			{tags.map((tag) => {
				const tagId = tag.id;
				const isGroupOpened = toggledTags.includes(tagId) !== invertOpenedTags;
				return (
					<li
						key={tagId}
						className={cnTagsList('Tag')}
						onClick={(evt) => {
							if (onTagClick) {
								evt.stopPropagation();
								onTagClick(tagId);
							}
						}}
					>
						<div className={cnTagsList('TagBody')}>
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
						</div>

						{tag.childrens && isGroupOpened && (
							<span className={cnTagsList('TagGroup')}>
								<TagsList tags={tag.childrens} onTagClick={onTagClick} />
							</span>
						)}
					</li>
				);
			})}
		</ul>
	);
};
