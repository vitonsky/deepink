import { useCallback } from 'react';
import { activeNoteChanged, openedNotesControls } from '@core/state/notes';

import { useNotesRegistry } from '../Providers';

export const useNotesControl = () => {
	const notesRegistry = useNotesRegistry();

	const open = useCallback(
		async (id: string) => {
			const note = await notesRegistry.getById(id);
			if (!note) return false;

			openedNotesControls.add(note);
			activeNoteChanged(note.id);
			return true;
		},
		[notesRegistry],
	);

	return {
		open,
	};
};
