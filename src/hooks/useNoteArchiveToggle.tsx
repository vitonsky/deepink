import { useCallback } from 'react';
import { INote } from '@core/features/notes';
import {
	useNotesContext,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';

export const useNoteArchiveToggle = () => {
	const { noteUpdated } = useNotesContext();
	const updateNotes = useUpdateNotes();
	const notesRegistry = useNotesRegistry();

	return useCallback(
		async (note: INote) => {
			await notesRegistry.updateMeta([note.id], { isArchived: !note.isArchived });
			const updatedNote = await notesRegistry.getById(note.id);
			if (updatedNote) noteUpdated(updatedNote);
			updateNotes();
		},
		[updateNotes, noteUpdated, notesRegistry],
	);
};
