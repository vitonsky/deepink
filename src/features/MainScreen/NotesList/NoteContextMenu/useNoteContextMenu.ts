import { useDynamicContextMenu } from '@hooks/useDynamicContextMenu';

import { defaultNoteMenu } from './noteMenus';
import {
	ContextMenuOptions,
	useNoteContextMenuCallback,
} from './useNoteContextMenuCallback';

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
