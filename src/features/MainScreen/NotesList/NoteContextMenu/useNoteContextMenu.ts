import { NoteId } from '@core/features/notes';
import { useDynamicContextMenu } from '@hooks/useDynamicContextMenu';

import { defaultNoteMenu } from './noteMenus';
import { useNoteContextMenuCallback } from './useNoteContextMenuCallback';

export type ContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;
};

/**
 * Returns function for call context menu
 */
export const useNoteContextMenu = ({ closeNote, updateNotes }: ContextMenuOptions) => {
	const noteContextMenuCallback = useNoteContextMenuCallback({
		closeNote,
		updateNotes,
	});

	const openMenu = useDynamicContextMenu(noteContextMenuCallback, defaultNoteMenu);
	return openMenu;
};
