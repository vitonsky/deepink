import { INote } from '@core/features/notes';
import {
	useNotesContext,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId } from '@state/redux/profiles/profiles';

export const useUpdateArchivedStatus = (note: INote) => {
	const notesRegistry = useNotesRegistry();

	const { noteUpdated } = useNotesContext();
	const updateNotes = useUpdateNotes();
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	useCommandCallback(
		GLOBAL_COMMANDS.UPDATE_NOTE_ARCHIVE_STATUS,
		async () => {
			await notesRegistry.updateMeta([note.id], { isArchived: !note.isArchived });
			const updatedNote = await notesRegistry.getById(note.id);
			if (updatedNote) noteUpdated(updatedNote);
			updateNotes();
		},
		{ enabled: note.id === activeNoteId },
	);
};
