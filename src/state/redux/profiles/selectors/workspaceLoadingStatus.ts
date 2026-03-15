import { createAppSelector } from '@state/redux/utils';

import { ProfileScoped, selectActiveWorkspace } from '../profiles';
import { createWorkspaceSelector, selectWorkspaceRootSafe } from '../utils';

export const selectIsActiveWorkspaceLoaded = (scope: ProfileScoped) =>
	createAppSelector(selectActiveWorkspace(scope), (workspace) => {
		if (!workspace) return null;

		return Object.values(workspace.loadingStatus).every(Boolean);
	});

export const selectIsWorkspaceLoaded = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	({ loadingStatus }) => {
		return Object.values(loadingStatus).every(Boolean);
	},
);
