import { useDynamicContextMenu } from '@hooks/useDynamicContextMenu';

import { defaultNoteMenu } from './noteMenus';
import {
	ContextMenuOptions,
	useNoteContextMenuCallback,
} from './useNoteContextMenuCallback';

/**
 * Returns function for call note context menu
 */

export const useNoteContextMenu = ({ closeNote, updateNotes }: ContextMenuOptions) => {
	const noteContextMenuCallback = useNoteContextMenuCallback({
		closeNote,
		updateNotes,
	});

	return useDynamicContextMenu(noteContextMenuCallback, defaultNoteMenu);
};
