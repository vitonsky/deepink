import { GLOBAL_COMMANDS } from '@core/features/shortcuts/command';
import { useCommandSubscription } from '@core/features/shortcuts/commandHooks';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectOpenedNotes,
	selectRecentlyClosedNotes,
} from '@state/redux/profiles/profiles';

export const useNotesShortcuts = () => {
	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNotes);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	useCommandSubscription(GLOBAL_COMMANDS.CREATE_NOTE, createNote);

	useCommandSubscription(GLOBAL_COMMANDS.CLOSE_NOTE, () => {
		if (!activeNoteId) return;
		noteActions.close(activeNoteId);
	});

	useCommandSubscription(GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE, () => {
		if (!recentlyClosedNotes || recentlyClosedNotes.length === 0) return;
		noteActions.click(recentlyClosedNotes[recentlyClosedNotes.length - 1]);
	});

	useCommandSubscription(GLOBAL_COMMANDS.OPEN_NEXT_NOTE, () => {
		// switch only if 2 or more notes are opened
		if (!activeNoteId || openedNotes.length < 2) return;

		const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		const isLastNote = currentIndex + 1 === openedNotes.length;

		// If the current note is the last in the array, go back to the first
		const nextIndex = isLastNote ? 0 : currentIndex + 1;
		noteActions.click(openedNotes[nextIndex].id);
	});

	useCommandSubscription(GLOBAL_COMMANDS.OPEN_PREVIOUSLY_NOTE, () => {
		// switch only if 2 or more notes are opened
		if (!activeNoteId || openedNotes.length < 2) return;

		const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		const isFirstNote = currentIndex === 0;

		// If the current note is the first in the array, go to the last
		const previouslyIndex = isFirstNote ? openedNotes.length - 1 : currentIndex - 1;
		noteActions.click(openedNotes[previouslyIndex].id);
	});
};
