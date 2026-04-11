import { NOTES_VIEW } from '../profiles';
import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';

export const selectNotesView = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return NOTES_VIEW.All_NOTES;

		return workspace.view;
	},
);
