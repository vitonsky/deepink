import { useCallback } from 'react';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveTag, workspacesApi } from '@state/redux/profiles/profiles';

export const useUpdateNotes = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const notesRegistry = useNotesRegistry();
	const activeTag = useWorkspaceSelector(selectActiveTag);

	console.log('>> useUpdateNotes');

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

		dispatch(workspacesApi.setNotes({ ...workspaceData, notes }));
	}, [activeTag, dispatch, notesRegistry, workspaceData]);
};
