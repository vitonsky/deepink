import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

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
};

export const List: FC<IListProps> = ({ items, activeItem, onPick }) => {
	return (
		<ul className={cnList()}>
			{items.map((item) => {
				const tagId = item.id;
				const isGroupCollapsed = Boolean(item.collapsed);

				return (
					<li
						key={tagId}
						className={cnList('Item', { active: activeItem === tagId })}
					>
						<div
							className={cnList('ItemBody')}
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
							<span className={cnList('Group')}>
								<List
									items={item.childrens}
									activeItem={activeItem}
									onPick={onPick}
								/>
							</span>
						)}
					</li>
				);
			})}
		</ul>
	);
};
