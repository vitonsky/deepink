import { useCallback, useRef } from 'react';
import { useProfileControls } from '@features/App/Profile';
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

	const {
		api: { lexemes },
	} = useProfileControls();

	const notesRegistry = useNotesRegistry();
	const activeTag = useWorkspaceSelector(selectActiveTag);

	const search = useWorkspaceSelector(selectSearch);

	const requestContextRef = useRef(0);
	return useCallback(async () => {
		const contextId = ++requestContextRef.current;
		const isRequestCanceled = () => contextId !== requestContextRef.current;

		const searchText = search.trim();
		if (searchText) {
			console.debug('Notes text indexing...');
			const start = performance.now();
			await lexemes.index();

			if (isRequestCanceled()) return;
			console.debug('Notes indexing is completed', performance.now() - start);
		}

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

		if (isRequestCanceled()) return;

		dispatch(workspacesApi.setNotes({ ...workspaceData, notes }));
	}, [activeTag, dispatch, lexemes, notesRegistry, search, workspaceData]);
};
