import { useCallback, useEffect, useRef, useState } from 'react';

import { NoteId } from '../../../../../core/Note';
import { ContextMenu } from '../../../../../electron/contextMenu';

import { ElectronContextMenu } from './ElectronContextMenu';

export type NoteContextMenuCallback<T extends string> = (event: {
	noteId: NoteId;
	action: T;
}) => void;

// TODO: implement context menu on web technologies
/**
 * Provide callback to trigger open note context menu
 */
export const useNoteContextMenu = <T extends string>(menu: ContextMenu, callback: NoteContextMenuCallback<T>) => {
	const [contextMenu, setContextMenu] = useState(() => {
		// TODO: provide constructor in react context
		return new ElectronContextMenu<T>(menu);
	});

	// Update menu
	useEffect(() => {
		setContextMenu(new ElectronContextMenu(menu));
	}, [menu]);

	const contextMenuTargetRef = useRef<NoteId | null>(null);
	const show = useCallback(
		(id: NoteId, point: { x: number; y: number }) => {
			contextMenu.open(point);
			contextMenuTargetRef.current = id;
		},
		[contextMenu],
	);

	useEffect(() => {
		const unsubscribeOnClose = contextMenu.onClose(() => {
			contextMenuTargetRef.current = null;
		});

		const unsubscribeOnClick = contextMenu.onClick((action) => {
			const noteId = contextMenuTargetRef.current;
			if (noteId === null) return;

			contextMenuTargetRef.current = null;
			callback({ action, noteId });
		});

		return () => {
			unsubscribeOnClose();
			unsubscribeOnClick();
		};
	}, [callback, contextMenu]);

	return show;
};
