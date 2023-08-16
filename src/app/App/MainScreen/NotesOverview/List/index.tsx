import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

import { ClassNameExtensions, extendClassName } from '../../../../../utils/className';

import './List.css';

const cnList = cn('List');

export type ListItem = {
	id: string;
	content: ReactNode;
	childrens?: ListItem[];
	collapsed?: boolean;
};

export type IListProps = {
	items: ListItem[];
	activeItem?: string;
	onPick?: (id: string) => void;
	classNameExtensions?: ClassNameExtensions;
};

export const List: FC<IListProps> = ({ items, ...props }) => {
	const { activeItem, onPick, classNameExtensions = {} } = props;
	const extendedListCn = extendClassName(cnList, classNameExtensions);

	return (
		<ul className={extendedListCn()}>
			{items.map((item) => {
				const tagId = item.id;
				const isGroupCollapsed = Boolean(item.collapsed);

				return (
					<li
						key={tagId}
						className={extendedListCn('Item', {
							active: activeItem === tagId,
						})}
					>
						<div
							className={extendedListCn('ItemBody')}
							onClick={(evt) => {
								if (onPick) {
									evt.stopPropagation();
									onPick(tagId);
								}
							}}
						>
							{item.content}
						</div>

						{item.childrens && !isGroupCollapsed && (
							<span className={extendedListCn('Group')}>
								<List items={item.childrens} {...props} />
							</span>
						)}
					</li>
				);
			})}
		</ul>
	);
};
