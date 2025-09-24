import { INote } from '@core/features/notes';

/**
 * Returns the ID of a note relative to the currently active note.
 * When reaching the end of the array, returns the first element, when reaching the start of the array, returns the last element
 */
export const getNextNoteIdByDirection = (
	openedNotes: INote[],
	activeNoteId: string | null,
	direction: 1 | -1,
) => {
	if (!activeNoteId || openedNotes.length < 2) return null;

	const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
	if (currentIndex === -1) return null;

	const nextIndex =
		(currentIndex + direction + openedNotes.length) % openedNotes.length;
	return openedNotes[nextIndex].id;
};
