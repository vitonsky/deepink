import { createAppSelector } from '@state/redux/utils';

import { ProfileScoped, selectActiveWorkspace } from '../profiles';
import {
	createWorkspaceSelector,
	selectWorkspaceRoot,
	selectWorkspaceRootSafe,
} from '../utils';

export const selectIsActiveWorkspaceLoaded = (scope: ProfileScoped) =>
	createAppSelector(selectActiveWorkspace(scope), (workspace) => {
		if (!workspace) return false;

		return Object.values(workspace.loadingStatus).every(Boolean);
	});

export const selectIsWorkspaceLoaded = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	({ loadingStatus }) => {
		return Object.values(loadingStatus).every(Boolean);
	},
);

export const selectIsTagsReady = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return false;

		return workspace.loadingStatus.isTagsLoaded;
	},
);
