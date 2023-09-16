import { useCallback } from 'react';

import { openedNotesControls } from '../../../core/state/notes';

import { useNotesRegistry } from '../Providers';

export const useNotesControl = () => {
	const notesRegistry = useNotesRegistry();

	// TODO: make new note are active
	const open = useCallback(
		async (id: string) => {
			const note = await notesRegistry.getById(id);
			if (!note) return false;

			openedNotesControls.add(note);
			return true;
		},
		[notesRegistry],
	);

	return {
		open,
	};
};
