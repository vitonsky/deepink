import { createAppSelector } from '@state/redux/utils';

import { ProfileScoped, selectActiveWorkspace } from '../profiles';
import { createWorkspaceSelector, selectWorkspaceRootSafe } from '../utils';

export const selectIsActiveWorkspaceLoaded = (scope: ProfileScoped) =>
	createAppSelector(selectActiveWorkspace(scope), (workspace) => {
		if (!workspace) return null;

		// If an error occurs during loading, it means the loading process has stopped
		return (
			workspace.loadingError !== null ||
			Object.values(workspace.loadingStatus).every(Boolean)
		);
	});

export const selectIsWorkspaceLoaded = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	({ loadingStatus }) => {
		return Object.values(loadingStatus).every(Boolean);
	},
);

export const selectWorkspaceLoadingError = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	({ loadingError: restoreError }) => {
		return restoreError;
	},
);
