import { useEffect } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions } from '@state/redux/profiles/hooks';

import { useTagsRegistry } from './WorkspaceProvider';

/**
 * Subscribes to tag changes
 */
export const useWorkspaceTags = () => {
	const workspaceActions = useWorkspaceActions();
	const dispatch = useAppDispatch();
	const tagsRegistry = useTagsRegistry();

	// Load tags
	useEffect(() => {
		let isCanceled = false;

		const updateTags = () =>
			tagsRegistry.getTags().then((tags) => {
				if (isCanceled) return;
				dispatch(workspaceActions.setTags({ tags }));
			});

		const cleanup = tagsRegistry.onChange(updateTags);
		return () => {
			isCanceled = true;
			cleanup();
		};
	}, [dispatch, tagsRegistry, workspaceActions]);
};
