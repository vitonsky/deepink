import { useCallback } from "react";

import { ContextMenu } from "../../../../../electron/contextMenu";
import { NoteContextMenuCallback, useNoteContextMenu } from "../../NotesList/NoteContextMenu/useNoteContextMenu";


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
	const noteContextMenuCallback: NoteContextMenuCallback<TagContextMenu> = useCallback(
		async ({ noteId, action }) => {
			const actionsMap = {
				[TagContextMenu.EDIT]: onEdit,
				[TagContextMenu.DELETE]: onDelete,
			};

			if (action in actionsMap) {
				actionsMap[action](noteId);
			}
		},
		[onDelete, onEdit],
	);

	return useNoteContextMenu(tagMenu, noteContextMenuCallback);
};
