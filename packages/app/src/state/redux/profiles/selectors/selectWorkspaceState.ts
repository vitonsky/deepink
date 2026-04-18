import isEqual from 'lodash/isEqual';
import { WorkspaceStateData } from '@features/App/Workspace/services/workspaceState';

import { createAppSelector } from '../../utils';

import { profilesSlice, WorkspaceScoped } from '../profiles';

export const selectWorkspaceState = ({ vaultId, workspaceId }: WorkspaceScoped) =>
	createAppSelector(
		[profilesSlice.selectSlice],
		(state): WorkspaceStateData | null => {
			const vault = state.vaults[vaultId];
			if (!vault) return null;

			const workspace = vault.workspaces[workspaceId];
			if (!workspace) return null;

			return {
				openedNoteIds: workspace.openedNotes.map((n) => n.id),
				activeNoteId: workspace.activeNote,
				selectedTagId: workspace.tags.selected,
				view: workspace.view,
				search: workspace.search,
			};
		},
		{
			memoizeOptions: {
				resultEqualityCheck: isEqual,
			},
		},
	);
