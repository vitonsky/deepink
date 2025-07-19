import { useMemo } from 'react';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNote, selectDeletedNotes } from '@state/redux/profiles/profiles';

export const useIsActiveNoteDeleted = () => {
	const activeNote = useWorkspaceSelector(selectActiveNote);
	const deletedNotes = useWorkspaceSelector(selectDeletedNotes);

	const isDeleted = useMemo(() => {
		if (!activeNote) return false;
		if (activeNote.isDeleted) return true;

		// if the active note is not found in deletedNotes, the note was restored
		return deletedNotes.some((note) => note.id === activeNote.id);
	}, [activeNote, deletedNotes]);

	return isDeleted;
};
