import { useCallback, useEffect, useState } from 'react';
import { ContextMenu } from '@electron/requests/contextMenu';
import { useContextMenu } from '@hooks/useContextMenu';

import { defaultNoteMenu } from './noteContextMenus';
import {
	ContextMenuOptions,
	useNoteContextMenuCallback,
} from './useNoteContextMenuCallback';

/**
 * Returns a function that accepts a note ID, screen coordinates, and a function that provides the menu configuration.
 */
export const useNoteContextMenu = ({ closeNote, updateNotes }: ContextMenuOptions) => {
	const noteContextMenuCallback = useNoteContextMenuCallback({
		closeNote,
		updateNotes,
	});

	// dynamic update menu
	const [menu, setMenu] = useState<{
		menu: ContextMenu;
		target: { id: string; point: { x: number; y: number } } | null;
	}>({ menu: defaultNoteMenu, target: null });

	const openMenu = useContextMenu(menu.menu, noteContextMenuCallback);

	// open menu only after update openMenu
	useEffect(() => {
		if (!menu.target) return;

		openMenu(menu.target.id, menu.target.point);
	}, [menu, openMenu]);

	// Updates the menu state first to ensure openMenu has the latest menu
	return useCallback(
		(id: string, point: { x: number; y: number }, menu: ContextMenu) => {
			setMenu({ menu, target: { id, point } });
		},
		[],
	);
};
