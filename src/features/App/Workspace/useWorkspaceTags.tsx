import { useEffect } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingStatus';

import { useTagsRegistry } from './WorkspaceProvider';

/**
 * Loads tags and subscribes to tag changes
 */
export const useWorkspaceTags = () => {
	const workspaceActions = useWorkspaceActions();
	const dispatch = useAppDispatch();
	const tagsRegistry = useTagsRegistry();

	// Load tags
	const isTagsReady = useWorkspaceSelector(selectIsTagsReady);
	useEffect(() => {
		const updateTags = () =>
			tagsRegistry.getTags().then((tags) => {
				dispatch(workspaceActions.setTags({ tags }));

				if (!isTagsReady) {
					dispatch(
						workspaceActions.setWorkspaceLoadingStatus({
							status: { isTagsLoaded: true },
						}),
					);
				}
			});

		updateTags();

		return tagsRegistry.onChange(updateTags);
	}, [dispatch, isTagsReady, tagsRegistry, workspaceActions]);
};
