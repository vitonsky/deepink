import { useEffect } from 'react';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions } from '@state/redux/profiles/hooks';

import { useTagsRegistry } from './WorkspaceProvider';

/**
 * Keeps the tags list up to date.
 * Subscribes to tag changes in the database and syncs updates to Redux
 */
export const useSyncTagsFromRegistry = () => {
	const workspaceActions = useWorkspaceActions();
	const dispatch = useAppDispatch();
	const tagsRegistry = useTagsRegistry();

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
