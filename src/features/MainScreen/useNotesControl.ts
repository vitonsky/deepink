import { useCallback } from 'react';
import { useNotesContext } from '@features/Workspace/WorkspaceProvider';

import { useNotesRegistry } from '../Providers';

export const useNotesControl = () => {
	const notesRegistry = useNotesRegistry();
	const { events } = useNotesContext();

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
