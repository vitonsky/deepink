import { useCallback } from 'react';
import { useNotesContext, useNotesRegistry } from '@features/Workspace/WorkspaceProvider';

export const useNotesControl = () => {
	const notesRegistry = useNotesRegistry();
	const { openNote } = useNotesContext();

	const open = useCallback(
		async (id: string) => {
			const note = await notesRegistry.getById(id);
			if (!note) return false;

			openNote(note);
			return true;
		},
		[notesRegistry, openNote],
	);

	return {
		open,
	};
};
