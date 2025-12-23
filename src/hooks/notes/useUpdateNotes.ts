import { useCallback, useRef } from 'react';
import { useProfileControls } from '@features/App/Profile';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	NOTES_VIEW,
	selectActiveTag,
	selectSearch,
	workspacesApi,
} from '@state/redux/profiles/profiles';
import { selectNotesView } from '@state/redux/profiles/selectors/view';

export const useUpdateNotes = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const notesView = useWorkspaceSelector(selectNotesView);

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

		const tags = activeTag !== null ? [activeTag.id] : [];

		const notes = await notesRegistry.get({
			limit: 100,
			tags,
			sort: { by: 'updatedAt', order: 'desc' },
			search: searchText
				? {
						text: searchText,
				  }
				: undefined,
			meta: {
				isDeleted: notesView === NOTES_VIEW.BIN,
				// show archived notes only in archive view; pass undefined for bin view to get only deleted notes, regardless of their archived status
				...(notesView !== NOTES_VIEW.BIN && {
					isArchived: notesView === NOTES_VIEW.ARCHIVE,
				}),
				...(notesView === NOTES_VIEW.BOOKMARK && { isBookmarked: true }),
			},
		});

		if (isRequestCanceled()) return;

		dispatch(workspacesApi.setNotes({ ...workspaceData, notes }));
	}, [activeTag, dispatch, lexemes, notesView, notesRegistry, search, workspaceData]);
};
