import { useCallback } from "react";

import { ContextMenu } from "../../../../../electron/contextMenu";
import { ContextMenuCallback, useContextMenu } from "../../../../components/hooks/useContextMenu";


export enum TagContextMenu {
	EDIT = 'edit',
	DELETE = 'delete',
}

export const tagMenu: ContextMenu = [
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

type DefaultContextMenuOptions = {
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
};

export const useTagContextMenu = ({ onEdit, onDelete }: DefaultContextMenuOptions) => {
	const noteContextMenuCallback: ContextMenuCallback<TagContextMenu> = useCallback(
		async ({ id, action }) => {
			const actionsMap = {
				[TagContextMenu.EDIT]: onEdit,
				[TagContextMenu.DELETE]: onDelete,
			};

			if (action in actionsMap) {
				actionsMap[action](id);
			}
		},
		[onDelete, onEdit],
	);

	return useContextMenu(tagMenu, noteContextMenuCallback);
};
