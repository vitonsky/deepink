import { useEffect } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingStatus';

import { useTagsRegistry } from './WorkspaceProvider';

/**
 * Loads tags from registry and subscribes to changes
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

		const cleanup = tagsRegistry.onChange(updateTags);
		return cleanup;
	}, [dispatch, isTagsReady, tagsRegistry, workspaceActions]);
};
