import { useCallback } from 'react';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';

export const useUpdateBookmarksList = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const notesRegistry = useNotesRegistry();

	return useCallback(() => {
		notesRegistry.get({ bookmarks: true }).then((note) => {
			dispatch(
				workspacesApi.setBookmarks({
					...workspaceData,
					notes: note.map((n) => n.id),
				}),
			);
		});
	}, [dispatch, notesRegistry, workspaceData]);
};
