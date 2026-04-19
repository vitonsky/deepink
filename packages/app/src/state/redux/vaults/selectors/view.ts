import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';
import { NOTES_VIEW } from '../vaults';

export const selectNotesView = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return NOTES_VIEW.All_NOTES;

		return workspace.view;
	},
);
