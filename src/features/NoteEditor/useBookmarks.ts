import { useCallback, useEffect, useState } from 'react';
import { useBookmarksRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';

export const useBookmark = (noteId: string) => {
	const bookmarksRegistry = useBookmarksRegistry();
	const updateNotes = useUpdateNotes();

	const [inBookmark, setInBookmark] = useState<boolean | null>(null);

	useEffect(() => {
		bookmarksRegistry.has(noteId).then((exists) => {
			setInBookmark(exists);
		});
	}, [noteId, bookmarksRegistry]);

	const toggle = useCallback(async () => {
		if (inBookmark === null) return;

		const newValue = !inBookmark;
		setInBookmark(newValue);

		if (newValue) {
			await bookmarksRegistry.add(noteId);
		} else {
			await bookmarksRegistry.remove([noteId]);
		}

		updateNotes();
	}, [noteId, inBookmark, bookmarksRegistry, updateNotes]);

	return { inBookmark, toggle };
};
