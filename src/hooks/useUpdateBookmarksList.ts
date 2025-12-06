import { useCallback } from 'react';
import { useBookmarksRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

export const useUpdateBookmarksList = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const bookmarksRegistry = useBookmarksRegistry();

	return useCallback(async () => {
		const noteIds = await bookmarksRegistry.getList();
		dispatch(
			workspacesApi.setBookmarks({
				...workspaceData,
				notes: noteIds,
			}),
		);
	}, [dispatch, bookmarksRegistry, workspaceData]);
};
