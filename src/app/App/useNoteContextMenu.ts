import { useCallback, useEffect, useRef, useState } from 'react';

import { NoteId } from '../../core/Note';

import { ElectronContextMenu, noteMenuId } from '../ContextMenu/NoteContextMenu';

/**
 * Provide callback to trigger open note context menu
 */
export const useNoteContextMenu = () => {
	const [contextMenu] = useState(() => {
		// TODO: provide constructor in react context
		return new ElectronContextMenu(noteMenuId);
	});

	const contextMenuTargetRef = useRef<NoteId | null>(null);
	const show = useCallback((id: NoteId, point: { x: number, y: number }) => {
		contextMenu.open(point);
		contextMenuTargetRef.current = id;
	}, [contextMenu]);

	useEffect(() => {
		const unsubscribeOnClose = contextMenu.onClose(() => {
			contextMenuTargetRef.current = null;
		});

		const unsubscribeOnClick = contextMenu.onClick((action) => {
			const noteId = contextMenuTargetRef.current;
			if (noteId === null) return;

			// TODO: handle clicks
			console.log('Note action', { action, noteId });
		});

		return () => {
			unsubscribeOnClose();
			unsubscribeOnClick();
		};
	}, [contextMenu]);

	return show;
};