import { useCallback, useEffect, useState } from 'react';
import { ContextMenu } from '@electron/requests/contextMenu';
import { ContextMenuCallback, useContextMenu } from '@hooks/useContextMenu';

/**
 * Hook that returns a function to open the menu and supports dynamic menu selection
 */
export const useDynamicContextMenu = <T extends string>(
	contextMenuCallback: ContextMenuCallback<T>,
	defaultMenu: ContextMenu,
) => {
	// dynamic update menu
	const [menu, setMenu] = useState<{
		menu: ContextMenu;
		target: { id: string; point: { x: number; y: number } } | null;
	}>({ menu: defaultMenu, target: null });

	const openMenu = useContextMenu(menu.menu, contextMenuCallback);

	// open menu only after update openMenu
	useEffect(() => {
		if (!menu.target) return;

		openMenu(menu.target.id, menu.target.point);
	}, [menu, openMenu]);

	// Updates the menu state first to ensure openMenu has the latest menu
	return useCallback(
		(id: string, point: { x: number; y: number }, menu?: ContextMenu) => {
			setMenu((prev) => ({
				menu: menu ?? prev.menu,
				target: { id, point },
			}));
		},
		[],
	);
};
