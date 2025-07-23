import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';

export const selectNotesView = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return null;
		return workspace.view;
	},
);
