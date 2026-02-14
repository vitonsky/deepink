import {
	createWorkspaceSelector,
	selectWorkspaceRoot,
	selectWorkspaceRootSafe,
} from '../utils';

export const selectWorkspaceName = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	({ id, name }) => ({ id, name }),
);

export const selectNoteIds = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return [];
		return workspace.noteIds;
	},
);

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

		const { openedNotes } = workspace;

		return openedNotes.find((note) => note.id === activeNote) ?? null;
	},
);

export const selectRecentlyClosedNotes = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return [];
		return workspace.recentlyClosedNotes;
	},
);

export const selectWorkspaceConfig = createWorkspaceSelector(
	[selectWorkspaceRootSafe],
	(workspace) => {
		return workspace.config;
	},
);
export const selectNewNoteTemplate = createWorkspaceSelector(
	[selectWorkspaceConfig],
	(config) => {
		return config.newNote;
	},
);
