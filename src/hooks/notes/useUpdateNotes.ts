import { useCallback } from 'react';
import { useNotesRegistry } from '@features/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceSelector } from '@state/redux/workspaces/hooks';
import { selectActiveTag, workspacesApi } from '@state/redux/workspaces/workspaces';

export const useUpdateNotes = () => {
	const dispatch = useAppDispatch();

	const notesRegistry = useNotesRegistry();
	const activeTag = useWorkspaceSelector(selectActiveTag);

	return useCallback(async () => {
		const tags = activeTag === null ? [] : [activeTag.id];
		const notes = await notesRegistry.get({ limit: 10000, tags });
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		});

		dispatch(workspacesApi.setNotes({ workspace: 'default', notes }));
	}, [activeTag, dispatch, notesRegistry]);
};
