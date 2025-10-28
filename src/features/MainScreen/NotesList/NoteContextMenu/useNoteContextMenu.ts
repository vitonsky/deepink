import { useCallback } from 'react';
import { INote } from '@core/features/notes';
import { useDynamicContextMenu } from '@hooks/useDynamicContextMenu';

import { defaultNoteMenu, deletedNoteMenu } from './noteMenus';
import {
	ContextMenuOptions,
	useNoteContextMenuCallback,
} from './useNoteContextMenuCallback';

/**
 * Opens the context menu for a note.
 * Automatically selects the appropriate menu based on the notes state
 */
export const useNoteContextMenu = ({ closeNote, updateNotes }: ContextMenuOptions) => {
	const noteContextMenuCallback = useNoteContextMenuCallback({
		closeNote,
		updateNotes,
	});
	const openMenu = useDynamicContextMenu(noteContextMenuCallback, defaultNoteMenu);

	return useCallback(
		(note: INote, point: { x: number; y: number }) => {
			const menu = note.isDeleted ? deletedNoteMenu : defaultNoteMenu;

			openMenu(note.id, point, menu);
		},
		[openMenu],
	);
};
