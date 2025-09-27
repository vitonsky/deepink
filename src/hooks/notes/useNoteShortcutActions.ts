import { useCallback } from 'react';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectOpenedNotes,
	selectRecentlyClosedNotes,
} from '@state/redux/profiles/profiles';
import { getItemByOffset } from '@utils/collections/getItemByOffset';

/**
 * Hook handles note actions triggered via keyboard shortcuts, including create, close, restore and switch focus
 */
export const useNoteShortcutActions = () => {
	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNotes);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.CREATE_NOTE, createNote);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE,
		useCallback(() => {
			if (!activeNoteId) return;
			noteActions.close(activeNoteId);
		}, [activeNoteId, noteActions]),
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,
		useCallback(() => {
			const lastClosedNote = recentlyClosedNotes[recentlyClosedNotes.length - 1];
			if (!lastClosedNote) return;
			noteActions.click(lastClosedNote);
		}, [noteActions, recentlyClosedNotes]),
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE,
		useCallback(() => {
			const noteIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
			if (noteIndex === -1) return;
			const previousNote = getItemByOffset(openedNotes, noteIndex, 1);
			if (!previousNote) return;

			noteActions.click(previousNote.id);
		}, [activeNoteId, noteActions, openedNotes]),
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.FOCUS_NEXT_NOTE,
		useCallback(() => {
			const noteIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
			if (noteIndex === -1) return;
			const nextNote = getItemByOffset(openedNotes, noteIndex, -1);
			if (!nextNote) return;

			noteActions.click(nextNote.id);
		}, [activeNoteId, noteActions, openedNotes]),
	);
};
