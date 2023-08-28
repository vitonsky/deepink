import React, { FC, useMemo } from 'react';
import { IMenuDesktopProps, IMenuProps, Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { cn } from '@bem-react/classname';

import { ITag } from '../../../../../core/Registry/Tags/Tags';

import { getSortIndex } from './utils';

import './TagEditor.css';

export const cnTagEditor = cn('TagEditor');

export type ITagsListProps = Omit<IMenuDesktopProps, 'items'> & {
	/**
	 * Available tags
	 */
	tags: ITag[];

	tagName: string;

	onPickTag?: (id: string) => void;

	hasTagName?: (tagName: string) => boolean;

	onCreateTag?: (tagName: string) => void;
};

// TODO: move to standalone component
export const TagsList: FC<ITagsListProps> = ({ tags, tagName, onPickTag, onCreateTag, hasTagName, ...props }) => {
	const fixedTagName = tagName.trim().replace(/\/{2,}/g, '/').split('/').filter(Boolean).join('/');

	const tagsItems = useMemo(() => {
		const filteredTags = [...tags]
			.filter(
				({ resolvedName }) =>
					tagName.trim().length === 0 || resolvedName.includes(tagName),
			)
			.sort((a, b) => {
				const segments = tagName.split('/');
				if (segments.length > 1) {
					return getSortIndex(a.resolvedName, b.resolvedName, tagName);
				}

				const aLastSegment = a.resolvedName.split('/').slice(-1)[0];
				const bLastSegment = b.resolvedName.split('/').slice(-1)[0];
				return getSortIndex(aLastSegment, bLastSegment, tagName);
			})
			.map(({ id, resolvedName }) => ({ id, content: resolvedName }));

		// Add button to create new tag
		if (onCreateTag && fixedTagName.length > 0 && !filteredTags.some((tag) => tag.content === fixedTagName)) {
			if (!hasTagName || !hasTagName(fixedTagName)) {
				return [
					{
						id: 'createNew',
						content: `Create tag ${fixedTagName}`
					},
					...filteredTags
				];
			}
		}

		return filteredTags;
	}, [fixedTagName, hasTagName, onCreateTag, tagName, tags]);

	return (
		<Menu
			{...props as IMenuProps}
			className={cnTagEditor('TagsListInPopup', [props.className])}
			items={tagsItems}
			onPick={(id, index) => {
				if (id === 'createNew') {
					if (onCreateTag) {
						onCreateTag(fixedTagName);
					}
				} else if (onPickTag) {
					onPickTag(id);
				}

				if (props.onPick) {
					props.onPick(id, index);
				}
			}}
		/>
	);
};