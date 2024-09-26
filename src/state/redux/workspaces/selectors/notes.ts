import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';

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
