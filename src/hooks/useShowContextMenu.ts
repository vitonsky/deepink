import { useCallback } from 'react';
import { ContextMenu } from '@electron/requests/contextMenu';
import { ElectronContextMenu } from '@features/MainScreen/NotesList/NoteContextMenu/ElectronContextMenu';

import { ContextMenuCallback } from './useContextMenu';

export const useShowContextMenu = <T extends string>(
	callback: ContextMenuCallback<T>,
) => {
	return useCallback(
		async (id: string, point: { x: number; y: number }, menu: ContextMenu) => {
			const contextMenu = new ElectronContextMenu<T>(menu);

			contextMenu.open(point);

			const unsubscribeOnClick = contextMenu.onClick((action) => {
				callback({ action, id });
				unsubscribeOnClick();
			});

			const unsubscribeOnClose = contextMenu.onClose(() => {
				unsubscribeOnClick();
				unsubscribeOnClose();
			});
		},
		[callback],
	);
};
