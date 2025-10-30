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
		() => {
			if (!activeNoteId) return;
			noteActions.close(activeNoteId);
		},
		{ enabled: Boolean(activeNoteId) },
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,
		() => {
			const lastClosedNote = recentlyClosedNotes[recentlyClosedNotes.length - 1];
			if (!lastClosedNote) return;
			noteActions.click(lastClosedNote);
		},
		{ enabled: recentlyClosedNotes.length > 0 },
	);

	const focusNoteByOffset = (offset: number) => {
		if (!activeNoteId) return;
		const noteIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		if (noteIndex === -1) return;
		const note = getItemByOffset(openedNotes, noteIndex, offset);
		if (!note) return;

		noteActions.click(note.id);
	};

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE,
		() => focusNoteByOffset(-1),
		{ enabled: Boolean(activeNoteId) },
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.FOCUS_NEXT_NOTE,
		() => focusNoteByOffset(1),
		{ enabled: Boolean(activeNoteId) },
	);
};
