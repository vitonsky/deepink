import { useCallback } from 'react';
import { useStoreMap } from 'effector-react';
import { NoteId } from '@core/features/notes';
import { useNotesContext } from '@features/Workspace/WorkspaceProvider';

export const useNoteActions = () => {
	const activeNotesContext = useNotesContext();
	const { events: notesEvents } = activeNotesContext;

	const openedNotes = useStoreMap(
		activeNotesContext.$notes,
		({ openedNotes }) => openedNotes,
	);

	const notes = useStoreMap(activeNotesContext.$notes, ({ notes }) => notes);

	// TODO: focus on note input
	const click = useCallback(
		(id: NoteId) => {
			const isNoteOpened = openedNotes.some((note) => note.id === id);
			if (isNoteOpened) {
				notesEvents.activeNoteChanged(id);
			} else {
				const note = notes.find((note) => note.id === id);
				if (note) {
					notesEvents.noteOpened(note);
				}
			}
		},
		[notes, notesEvents, openedNotes],
	);

	const close = useCallback(
		(id: NoteId) => {
			notesEvents.noteClosed(id);
		},
		[notesEvents],
	);

	return { click, close };
};
