import { NoteActions, noteMenuId } from "../../../app/ContextMenu/NoteContextMenu";

import { ContextMenu } from "..";

export const noteMenu: ContextMenu = {
	id: noteMenuId,
	menu: [
		// TODO: implement
		// {
		// 	id: 'copyMarkdownLink',
		// 	label: 'Copy Markdown link',
		// },
		{
			id: NoteActions.DUPLICATE,
			label: 'duplicate',
		},
		{ type: 'separator' },
		{
			id: NoteActions.DELETE,
			label: 'delete',
		},
	],
};