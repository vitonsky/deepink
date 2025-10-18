import { useCallback } from 'react';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveTag,
	selectSearch,
	workspacesApi,
} from '@state/redux/profiles/profiles';

export const useUpdateNotes = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const notesRegistry = useNotesRegistry();
	const activeTag = useWorkspaceSelector(selectActiveTag);

	const search = useWorkspaceSelector(selectSearch);

	return useCallback(async () => {
		const searchText = search.trim();

		const tags = activeTag === null ? [] : [activeTag.id];
		const notes = await notesRegistry.get({
			limit: 100,
			tags,
			sort: { by: 'updatedAt', order: 'desc' },
			search: searchText
				? {
						text: searchText,
				  }
				: undefined,
		});
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		});

		dispatch(workspacesApi.setNotes({ ...workspaceData, notes }));
	}, [activeTag, dispatch, notesRegistry, search, workspaceData]);
};
