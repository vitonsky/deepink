import { useEffect } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { workspacesApi } from '@state/redux/profiles/profiles';
import { selectIsTagsReady } from '@state/redux/profiles/selectors/loadingStatus';

import { useTagsRegistry } from './WorkspaceProvider';

/**
 * Loads tags from registry and subscribes to changes
 */
export const useWorkspaceTags = () => {
	const workspaceData = useWorkspaceData();
	const dispatch = useAppDispatch();
	const tagsRegistry = useTagsRegistry();

	// Load tags
	const isTagsReady = useWorkspaceSelector(selectIsTagsReady);
	useEffect(() => {
		const updateTags = () =>
			tagsRegistry.getTags().then((tags) => {
				dispatch(workspacesApi.setTags({ ...workspaceData, tags }));

				if (!isTagsReady) {
					dispatch(
						workspacesApi.setWorkspaceLoadingStatus({
							...workspaceData,
							status: { isTagsReady: true },
						}),
					);
				}
			});

		updateTags();

		const cleanup = tagsRegistry.onChange(updateTags);
		return cleanup;
	}, [dispatch, workspaceData, isTagsReady, tagsRegistry]);
};
