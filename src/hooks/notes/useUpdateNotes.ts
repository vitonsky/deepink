import { useCallback, useRef } from 'react';
import { useProfileControls } from '@features/App/Profile';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	NOTES_VIEW,
	selectActiveTag,
	selectNotesOffset,
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
	const notesOffset = useWorkspaceSelector(selectNotesOffset);

	const requestContextRef = useRef(0);
	return useCallback(async () => {
		const contextId = ++requestContextRef.current;
		const isRequestCanceled = () => contextId !== requestContextRef.current;

		dispatch(workspacesApi.setIsNotesLoading({ ...workspaceData, isLoading: true }));

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
			limit: notesOffset,
			tags,
			sort: { by: 'updatedAt', order: 'desc' },
			search: searchText
				? {
						text: searchText,
				  }
				: undefined,
			meta: {
				isDeleted: notesView === NOTES_VIEW.BIN,
				// show archived notes only in archive view
				// but do not filter by the archived flag in bin view
				...(notesView !== NOTES_VIEW.BIN && {
					isArchived: notesView === NOTES_VIEW.ARCHIVE,
				}),
				...(notesView === NOTES_VIEW.BOOKMARK && { isBookmarked: true }),
			},
		});

		if (isRequestCanceled()) {
			dispatch(
				workspacesApi.setIsNotesLoading({
					...workspaceData,
					isLoading: false,
				}),
			);
			return;
		}

		dispatch(workspacesApi.setNotes({ ...workspaceData, notes }));
		dispatch(workspacesApi.setIsNotesLoading({ ...workspaceData, isLoading: false }));
	}, [
		search,
		activeTag,
		notesView,
		notesRegistry,
		notesOffset,
		dispatch,
		workspaceData,
		lexemes,
	]);
};
