import { useCallback, useMemo } from 'react';
import { useBookmarksRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useUpdateBookmarksList } from '@hooks/useUpdateBookmarksList';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectBookmarks } from '@state/redux/profiles/profiles';

export const useBookmarkToggle = (noteId: string) => {
	const bookmarksRegistry = useBookmarksRegistry();
	const updateNotes = useUpdateNotes();
	const updateBookmarksList = useUpdateBookmarksList();

	const bookmarks = useWorkspaceSelector(selectBookmarks);
	const bookmarkNoteIdSet = useMemo(() => new Set(bookmarks), [bookmarks]);

	const isBookmarked = bookmarkNoteIdSet.has(noteId);
	const toggleBookmarkStatus = useCallback(async () => {
		isBookmarked
			? await bookmarksRegistry.delete([noteId])
			: await bookmarksRegistry.add(noteId);

		updateNotes();
		updateBookmarksList();
	}, [isBookmarked, updateNotes, updateBookmarksList, bookmarksRegistry, noteId]);

	return { isBookmarked, toggleBookmarkStatus };
};
