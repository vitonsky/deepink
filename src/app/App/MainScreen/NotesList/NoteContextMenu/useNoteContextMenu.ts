import { useCallback, useEffect, useRef, useState } from 'react';

import { NoteId } from '../../../../../core/Note';

import { ElectronContextMenu } from './ElectronContextMenu';
import { NoteActions } from '.';

export type NoteContextMenuCallback = (event: {
	noteId: NoteId;
	action: NoteActions;
}) => void;

/**
 * Provide callback to trigger open note context menu
 */
export const useNoteContextMenu = (callback: NoteContextMenuCallback) => {
	const [contextMenu] = useState(() => {
		// TODO: provide constructor in react context
		return new ElectronContextMenu();
	});

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
