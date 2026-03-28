import { shallowEqual } from 'react-redux';

import { createAppSelector } from '../../utils';

import { profilesSlice, WorkspaceScoped } from '../profiles';

export const selectWorkspaceState = ({ profileId, workspaceId }: WorkspaceScoped) =>
	createAppSelector(
		[profilesSlice.selectSlice],
		(state) => {
			const workspace = state.profiles[profileId]?.workspaces[workspaceId];
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
				resultEqualityCheck: (prev, next) => {
					if (prev === next) return true;
					if (!prev || !next) return false;

					return (
						shallowEqual(prev.openedNoteIds, next.openedNoteIds) &&
						prev.activeNoteId === next.activeNoteId &&
						prev.selectedTagId === next.selectedTagId &&
						prev.view === next.view &&
						prev.search === next.search
					);
				},
			},
		},
	);
