import { NOTES_VIEW } from '../profiles';
import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';

export const selectNotesView = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		return workspace?.view ?? NOTES_VIEW.All_NOTES;
	},
);
