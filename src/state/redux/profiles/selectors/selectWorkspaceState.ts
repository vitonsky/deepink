import { shallowEqual } from 'react-redux';
import z from 'zod';

import { createAppSelector } from '../../utils';

import { NOTES_VIEW, profilesSlice, WorkspaceScoped } from '../profiles';

export const WorkspaceStateScheme = z.object({
	openedNoteIds: z.array(z.string()).nullable(),
	activeNoteId: z.string().nullable(),
	selectedTagId: z.string().nullable(),
	view: z.enum(NOTES_VIEW),
	search: z.string(),
});

export type WorkspaceStateData = z.output<typeof WorkspaceStateScheme>;

export const selectWorkspaceState = ({ profileId, workspaceId }: WorkspaceScoped) =>
	createAppSelector(
		[profilesSlice.selectSlice],
		(state): WorkspaceStateData | null => {
			const profile = state.profiles[profileId];
			if (!profile) return null;

			const workspace = profile.workspaces[workspaceId];
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
