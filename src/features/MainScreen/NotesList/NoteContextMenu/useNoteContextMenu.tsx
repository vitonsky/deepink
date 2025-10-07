import { useCallback } from 'react';
import { INote } from '@core/features/notes';

import { ContextMenu } from './ContextMenu';
import { useContextMenuProvider } from './ContextMenuProvider';
import {
	ContextMenuOptions,
	useNoteContextMenuCallback,
} from './useNoteContextMenuCallback';
import { NoteActions } from '.';

export const defaultNoteMenu: ContextMenu = [
	{
		id: NoteActions.DUPLICATE,
		label: 'Duplicate',
	},
	{
		id: NoteActions.COPY_MARKDOWN_LINK,
		label: 'Copy markdown link',
	},
	{
		id: NoteActions.EXPORT,
		label: 'Export',
	},
	{ type: 'separator' },
	{
		id: NoteActions.DELETE,
		label: 'Delete',
	},
];

export const deletedNoteMenu: ContextMenu = [
	{
		id: NoteActions.RESTORE,
		label: 'Restore',
	},
	{
		id: NoteActions.EXPORT,
		label: 'Export',
	},
	{ type: 'separator' },
	{
		id: NoteActions.DELETE,
		label: 'Delete',
	},
];

export const useNoteContextMenu = (options: ContextMenuOptions) => {
	const noteCallback = useNoteContextMenuCallback(options);
	const contextMenu = useContextMenuProvider();

	return useCallback(
		(note: INote, position: { x: number; y: number }) => {
			const items = note.isDeleted ? deletedNoteMenu : defaultNoteMenu;

			contextMenu.show({
				items,
				position: { x: position.x, y: position.y },
				onAction: (action) => {
					noteCallback({ id: note.id, action: action as NoteActions });
				},
			});
		},
		[contextMenu, noteCallback],
	);
};
