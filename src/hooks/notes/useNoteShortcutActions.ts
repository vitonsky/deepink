import { useCallback } from 'react';
import { GLOBAL_COMMANDS } from '@core/features/commands';
import { useCommandListener } from '@core/features/commands/useCommandListener';
import { INote } from '@core/features/notes';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectOpenedNotes,
	selectRecentlyClosedNotes,
} from '@state/redux/profiles/profiles';

/**
 * Returns the ID of a note relative to the currently active note.
 * When reaching the end of the array, returns the first element, when reaching the start of the array, returns the last element
 */
const getRelativeNoteId = (
	openedNotes: INote[],
	activeNoteId: string | null,
	offset: number,
) => {
	if (!activeNoteId || openedNotes.length < 2) return null;

	const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
	if (currentIndex === -1) return null;

	const nextIndex = (currentIndex + offset + openedNotes.length) % openedNotes.length;
	return openedNotes[nextIndex].id;
};

/**
 * Hook handles note actions triggered via keyboard shortcuts, including create, close, restore, and navigation
 */
export const useNoteShortcutActions = () => {
	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNotes);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	useCommandListener(GLOBAL_COMMANDS.CREATE_NOTE, createNote);

	useCommandListener(
		GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE,
		useCallback(() => {
			if (!activeNoteId) return;
			noteActions.close(activeNoteId);
		}, [activeNoteId, noteActions]),
	);

	useCommandListener(
		GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,
		useCallback(() => {
			if (recentlyClosedNotes.length === 0) return;
			noteActions.click(recentlyClosedNotes[recentlyClosedNotes.length - 1]);
		}, [noteActions, recentlyClosedNotes]),
	);

	useCommandListener(
		GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE,
		useCallback(() => {
			const previousNote = getRelativeNoteId(openedNotes, activeNoteId, +1);
			if (!previousNote) return;
			noteActions.click(previousNote);
		}, [activeNoteId, noteActions, openedNotes]),
	);

	useCommandListener(
		GLOBAL_COMMANDS.FOCUS_NEXT_NOTE,
		useCallback(() => {
			const nextNote = getRelativeNoteId(openedNotes, activeNoteId, -1);
			if (!nextNote) return;
			noteActions.click(nextNote);
		}, [activeNoteId, noteActions, openedNotes]),
	);
};
