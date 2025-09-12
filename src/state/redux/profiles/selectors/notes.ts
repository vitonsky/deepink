import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';

export const selectWorkspaceName = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) throw new Error('Workspace selector used out of workspace scope');

		const { id, name } = workspace;
		return { id, name };
	},
);

export const selectNotes = createWorkspaceSelector([selectWorkspaceRoot], (workspace) => {
	if (!workspace) return [];
	return workspace.notes;
});

export const selectOpenedNotes = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return [];
		return workspace.openedNotes;
	},
);

export const selectIsNoteOpened = (noteId: string) =>
	createWorkspaceSelector([selectWorkspaceRoot], (workspace) => {
		if (!workspace) return false;
		return workspace.openedNotes.some((note) => note.id === noteId);
	});

export const selectNote = (noteId: string | null) =>
	createWorkspaceSelector([selectWorkspaceRoot], (workspace) => {
		if (!workspace) return null;
		if (!noteId) return null;

		const { notes } = workspace;

		return notes.find((note) => note.id === noteId) ?? null;
	});

export const selectActiveNoteId = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return null;

		return workspace.activeNote ?? null;
	},
);

export const selectSearch = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return '';

		return workspace.search;
	},
);

export const selectActiveNote = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return null;

		const { activeNote } = workspace;
		if (!activeNote) return null;

		const { notes } = workspace;

		return notes.find((note) => note.id === activeNote) ?? null;
	},
);

export const selectRecentlyClosedNotes = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return [];
		return workspace.recentlyClosedNotes;
	},
);
