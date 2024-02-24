import { useCallback } from 'react';
import { useActiveNotesContext } from '@features/App/utils/activeNotes';

import { useNotesRegistry } from '../Providers';

export const useNotesControl = () => {
	const notesRegistry = useNotesRegistry();
	const { events } = useActiveNotesContext();

	const open = useCallback(
		async (id: string) => {
			const note = await notesRegistry.getById(id);
			if (!note) return false;

			events.noteOpened(note);
			return true;
		},
		[events, notesRegistry],
	);

	return {
		open,
	};
};
