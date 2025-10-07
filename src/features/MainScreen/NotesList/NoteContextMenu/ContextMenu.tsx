import React from 'react';
import { Menu, MenuDivider, MenuItem, MenuList, Portal } from '@chakra-ui/react';

type MenuItem<T = string> = {
	id: T;
	label: string;
	type?: 'item';
};

export type ContextMenu<T = string> = (
	| MenuItem<T>
	| {
			type: 'separator';
	  }
)[];

type ContextMenuProps = {
	items: ContextMenu;
	onAction: (id: string) => void;
	position: { x: number; y: number };
	isOpen: boolean;
	onClose: () => void;
};

export const ContextMenu = ({
	items,
	position,
	onAction,
	isOpen,
	onClose,
}: ContextMenuProps) => {
	return (
		<Menu isOpen={isOpen} onClose={onClose}>
			<Portal>
				<MenuList
					position="absolute"
					top={`${position.y}px`}
					left={`${position.x}px`}
				>
					{items.map((item, i) =>
						item.type === 'separator' ? (
							<MenuDivider key={i} />
						) : (
							<MenuItem
								key={item.id}
								onClick={() => {
									onAction(item.id);
									onClose();
								}}
							>
								{item.label}
							</MenuItem>
						),
					)}
				</MenuList>
			</Portal>
		</Menu>
	);
};
