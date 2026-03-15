import { useEffect } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectIsWorkspaceTagsLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';

import { useTagsRegistry } from './WorkspaceProvider';

/**
 * Loads tags and subscribes to tag changes
 */
export const useWorkspaceTags = () => {
	const workspaceActions = useWorkspaceActions();
	const dispatch = useAppDispatch();
	const tagsRegistry = useTagsRegistry();

	// Load tags
	const isWorkspaceTagsLoaded = useWorkspaceSelector(selectIsWorkspaceTagsLoaded);
	useEffect(() => {
		const updateTags = () =>
			tagsRegistry.getTags().then((tags) => {
				dispatch(workspaceActions.setTags({ tags }));

				if (!isWorkspaceTagsLoaded) {
					dispatch(
						workspaceActions.setWorkspaceLoadingStatus({
							isTagsLoaded: true,
						}),
					);
				}
			});

		updateTags();

		return tagsRegistry.onChange(updateTags);
	}, [dispatch, isWorkspaceTagsLoaded, tagsRegistry, workspaceActions]);
};
