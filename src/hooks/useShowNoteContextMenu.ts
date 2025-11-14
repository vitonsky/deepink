import { useCallback } from 'react';
import { ContextMenu } from '@electron/requests/contextMenu';
import { NoteActions } from '@features/MainScreen/NotesList/NoteContextMenu';
import { ElectronContextMenu } from '@features/MainScreen/NotesList/NoteContextMenu/ElectronContextMenu';

import { ContextMenuCallback } from './useContextMenu';

export const useShowNoteContextMenu = (callback: ContextMenuCallback<NoteActions>) => {
	return useCallback(
		(id: string, point: { x: number; y: number }, menu: ContextMenu) => {
			const contextMenu = new ElectronContextMenu<NoteActions>(menu);

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
