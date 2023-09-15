import { useCallback } from 'react';

import { ContextMenu } from '../../../../../electron/contextMenu';
import {
	ContextMenuCallback,
	useContextMenu,
} from '../../../../components/hooks/useContextMenu';

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
	const noteContextMenuCallback: ContextMenuCallback<TagContextMenu> = useCallback(
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

	return useContextMenu(tagMenu, noteContextMenuCallback);
};
