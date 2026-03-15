import {
	createVaultSelector,
	createWorkspaceSelector,
	selectWorkspaceRoot,
	selectWorkspaceRootSafe,
} from '../utils';
import { selectVault } from './vault';

export const selectIsActiveWorkspaceLoaded = createVaultSelector(
	[selectVault],
	(vault) => {
		const activeWorkspace = vault.activeWorkspace;
		if (!activeWorkspace) return false;

		const workspace = vault.workspaces[activeWorkspace];
		if (!workspace) return false;

		return Object.values(workspace.loadingStatus).every(Boolean);
	},
);

export const selectIsWorkspaceLoaded = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	({ loadingStatus }) => {
		return Object.values(loadingStatus).every(Boolean);
	},
);

export const selectIsWorkspaceTagsLoaded = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return false;

		return workspace.loadingStatus.isTagsLoaded;
	},
);
