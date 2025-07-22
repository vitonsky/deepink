import { useCallback, useEffect, useRef } from 'react';
import { ContextMenu } from '@electron/requests/contextMenu';
import { ElectronContextMenu } from '@features/MainScreen/NotesList/NoteContextMenu/ElectronContextMenu';

export type ContextMenuCallback<T extends string> = (event: {
	id: string;
	action: T;
}) => void;

// TODO: implement context menu on web technologies
/**
 * Provide callback for open context menu
 */
export const useContextMenu = <T extends string>(
	menu: ContextMenu,
	callback: ContextMenuCallback<T>,
) => {
	const contextMenuRef = useRef<ElectronContextMenu<T> | null>(null);

	const contextMenuTargetRef = useRef<string | null>(null);
	const show = useCallback((id: string, point: { x: number; y: number }) => {
		const contextMenu = contextMenuRef.current;
		if (!contextMenu) return;

		contextMenu.open(point);
		contextMenuTargetRef.current = id;
	}, []);

	useEffect(() => {
		// TODO: provide constructor in react context
		const contextMenu = new ElectronContextMenu<T>(menu);
		contextMenuRef.current = contextMenu;

		const unsubscribeOnClose = contextMenu.onClose(() => {
			contextMenuTargetRef.current = null;
		});

		const unsubscribeOnClick = contextMenu.onClick((action) => {
			const id = contextMenuTargetRef.current;
			if (id === null) return;

			contextMenuTargetRef.current = null;
			callback({ action, id });
		});

		return () => {
			unsubscribeOnClose();
			unsubscribeOnClick();
		};
	}, [callback, menu]);

	return show;
};
