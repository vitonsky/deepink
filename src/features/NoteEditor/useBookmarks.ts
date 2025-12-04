import { useCallback, useMemo } from 'react';
import {
	useBookmarksRegistry,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectBookmarks, workspacesApi } from '@state/redux/profiles/profiles';

export const useUpdateBookmarksList = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const notesRegistry = useNotesRegistry();

	const updateBookmarksList = useCallback(() => {
		notesRegistry.get({ bookmarks: true }).then((note) => {
			dispatch(
				workspacesApi.setBookmarks({
					...workspaceData,
					notes: note.map((n) => n.id),
				}),
			);
		});
	}, [dispatch, notesRegistry, workspaceData]);
	return updateBookmarksList;
};

export const useBookmarkToggle = (noteId: string) => {
	const bookmarksRegistry = useBookmarksRegistry();
	const updateNotes = useUpdateNotes();
	const updateBookmarksList = useUpdateBookmarksList();

	const bookmarks = useWorkspaceSelector(selectBookmarks);
	const bookmarkNoteIdSet = useMemo(() => new Set(bookmarks), [bookmarks]);

	const isBookmarked = bookmarkNoteIdSet.has(noteId);
	const toggleBookmark = useCallback(async () => {
		isBookmarked
			? await bookmarksRegistry.remove([noteId])
			: await bookmarksRegistry.add(noteId);

		updateNotes();
		updateBookmarksList();
	}, [isBookmarked, updateNotes, updateBookmarksList, bookmarksRegistry, noteId]);

	return { isBookmarked, toggleBookmark };
};
