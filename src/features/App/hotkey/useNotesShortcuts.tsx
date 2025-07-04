import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectOpenedNotes,
	selectRecentlyClosedNote,
} from '@state/redux/profiles/profiles';

import { useCommandSubscription } from './commandHooks';
import { GLOBAL_COMMANDS } from './shortcuts';

export const useNotesShortcuts = () => {
	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNote);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	useCommandSubscription(GLOBAL_COMMANDS.CREATE_NOTE, createNote);

	useCommandSubscription(GLOBAL_COMMANDS.CLOSE_NOTE, () => {
		if (!activeNoteId) return;
		noteActions.close(activeNoteId);
	});

	useCommandSubscription(GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE, () => {
		if (!recentlyClosedNotes || !recentlyClosedNotes.length) return;
		noteActions.click(recentlyClosedNotes[recentlyClosedNotes.length - 1]);
	});

	useCommandSubscription(GLOBAL_COMMANDS.OPEN_NEXT_NOTE, () => {
		if (openedNotes.length <= 1 || !activeNoteId) return;

		const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		const isLastNote = currentIndex + 1 === openedNotes.length;
		const nextIndex = isLastNote ? 0 : currentIndex + 1;

		// If the current note is the last in the array, go back to the first
		noteActions.click(openedNotes[nextIndex].id);
	});

	useCommandSubscription(GLOBAL_COMMANDS.OPEN_PREVIOUSLY_NOTE, () => {
		if (openedNotes.length <= 1 || !activeNoteId) return;

		const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		const isFirstNote = currentIndex === 0;
		const previouslyIndex = isFirstNote ? openedNotes.length - 1 : currentIndex - 1;

		// If the current note is the first in the array, go to the last
		noteActions.click(openedNotes[previouslyIndex].id);
	});
};
