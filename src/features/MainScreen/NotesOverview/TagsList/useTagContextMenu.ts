import { useCallback } from 'react';
import { ContextMenu } from '@features/MainScreen/NotesList/NoteContextMenu/ContextMenu';
import { useContextMenuProvider } from '@features/MainScreen/NotesList/NoteContextMenu/ContextMenuProvider';
import { ContextMenuCallback } from '@hooks/useContextMenu';

export enum TagContextMenu {
	ADD = 'add',
	EDIT = 'edit',
	DELETE = 'delete',
}

export const tagMenu: ContextMenu = [
	{
		id: TagContextMenu.ADD,
		label: 'Add',
	},
	{
		id: TagContextMenu.EDIT,
		label: 'Edit',
	},
	{ type: 'separator' },
	{
		id: TagContextMenu.DELETE,
		label: 'Delete',
	},
];

export type TagContextMenuCallbacks = {
	onAdd: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
};

export const useTagContextMenu = ({
	onAdd,
	onEdit,
	onDelete,
}: TagContextMenuCallbacks) => {
	const tagContextMenuCallback: ContextMenuCallback<TagContextMenu> = useCallback(
		async ({ id, action }) => {
			const actionsMap = {
				[TagContextMenu.ADD]: onAdd,
				[TagContextMenu.EDIT]: onEdit,
				[TagContextMenu.DELETE]: onDelete,
			};

			if (action in actionsMap) {
				actionsMap[action](id);
			}
		},
		[onAdd, onEdit, onDelete],
	);

	const contextMenu = useContextMenuProvider();

	return useCallback(
		(id: string, position: { x: number; y: number }) => {
			contextMenu.show({
				items: tagMenu,
				position: { x: position.x, y: position.y },
				onAction: (action) => {
					tagContextMenuCallback({
						id: id,
						action: action as TagContextMenu,
					});
				},
			});
		},
		[contextMenu, tagContextMenuCallback],
	);
};
