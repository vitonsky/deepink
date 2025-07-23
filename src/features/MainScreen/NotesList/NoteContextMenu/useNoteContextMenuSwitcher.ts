import { useCallback, useEffect,useState } from 'react';
import { INotesController } from '@core/features/notes/controller';
import { ContextMenu } from '@electron/requests/contextMenu';
import { ContextMenuCallback, useContextMenu } from '@hooks/useContextMenu';

import { NoteActions } from '.';

/**
 * Switch the menu depending on which note it was invoked for
 */
export const useNoteContextMenuSwitcher = ({
	notesRegistry,
	noteContextMenuCallback,
	menus,
}: {
	notesRegistry: INotesController;
	noteContextMenuCallback: ContextMenuCallback<NoteActions>;
	menus: { default: ContextMenu; deleted: ContextMenu };
}) => {
	const [activeMenu, setActiveMenu] = useState<ContextMenu>(menus.default);
	const triggerContextMenu = useContextMenu(activeMenu, noteContextMenuCallback);

	const [menuTarget, setMenuTarget] = useState<{
		id: string;
		point: { x: number; y: number };
	} | null>(null);

	const openNoteContextMenu = useCallback(
		async (id: string, point: { x: number; y: number }) => {
			const note = await notesRegistry.getById(id);
			const menu = note?.isDeleted ? menus.deleted : menus.default;

			setActiveMenu(menu);
			setMenuTarget({ id, point });
		},
		[menus, notesRegistry],
	);

	useEffect(() => {
		if (!menuTarget) return;

		triggerContextMenu(menuTarget.id, menuTarget.point);
		setMenuTarget(null);
	}, [menuTarget, triggerContextMenu]);

	return openNoteContextMenu;
};
