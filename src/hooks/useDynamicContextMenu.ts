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
	const [menu, setMenu] = useState<ContextMenu>(defaultMenu);
	const [target, setTarget] = useState<{
		id: string;
		point: { x: number; y: number };
	} | null>(null);

	const openMenu = useContextMenu(menu, contextMenuCallback);

	// Open menu automatically when `target` is set
	// Ensures the menu is updated (after `menu` state updates)
	useEffect(() => {
		if (!target) return;
		openMenu(target.id, target.point);
	}, [menu, openMenu, target]);

	// Function to trigger opening of the menu
	return useCallback(
		(id: string, point: { x: number; y: number }, newMenu?: ContextMenu) => {
			if (newMenu) setMenu(newMenu);
			setTarget({ id, point });
		},
		[],
	);
};
