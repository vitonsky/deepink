import { useCallback } from 'react';
import { useStoreMap } from 'effector-react';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsContext,
} from '@features/Workspace/WorkspaceProvider';

export const useUpdateNotes = () => {
	const notesRegistry = useNotesRegistry();
	const activeNotesContext = useNotesContext();

	const setNotes = activeNotesContext.events.setNotes;

	const { $tags } = useTagsContext();
	const activeTag = useStoreMap($tags, ({ selected }) => selected);

	return useCallback(async () => {
		const tags = activeTag === null ? [] : [activeTag];
		const notes = await notesRegistry.get({ limit: 10000, tags });
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		});
		setNotes(notes);
	}, [activeTag, notesRegistry]);
};
