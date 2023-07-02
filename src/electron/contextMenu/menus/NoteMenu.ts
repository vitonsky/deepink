import { ContextMenu } from "..";

export const noteMenu: ContextMenu = {
	id: 'noteMenu',
	menu: [
		{
			// TODO: implement
			// id: 'copyMarkdownLink',
			label: 'Copy Markdown link',
		},
		{
			id: 'duplicate',
			label: 'Duplicate',
		},
		{ type: 'separator' },
		{
			id: 'delete',
			label: 'Delete note',
		},
	],
};