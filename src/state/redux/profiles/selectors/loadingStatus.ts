import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';

export const selectIsTagsReady = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return false;

		return workspace.loadingStatus.isTagsLoaded;
	},
);
