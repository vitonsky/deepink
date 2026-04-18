import { createAppSelector } from '@state/redux/utils';

import { createWorkspaceSelector, selectWorkspaceRootSafe } from '../utils';
import { selectActiveWorkspace, VaultScoped } from '../vaults';

export const selectIsActiveWorkspaceLoaded = (scope: VaultScoped) =>
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

export const selectIsWorkspaceConfigLoaded = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	({ loadingStatus }) => {
		return loadingStatus.isConfigLoaded;
	},
);
