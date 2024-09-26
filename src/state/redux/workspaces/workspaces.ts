import { INote, NoteId } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import { TagItem } from '@features/MainScreen/NotesOverview/TagsList';
import { createSlice, PayloadAction, Selector } from '@reduxjs/toolkit';

import { RootState } from '../store';
import { createAppSelector } from '../utils';

export type WorkspaceScoped<T extends {}> = T & {
	workspace: string;
};

/**
 * Find a note near current, but except current note in edge cases
 */
const findNearNote = (notes: INote[], noteId: NoteId) => {
	const currentNoteIndex = notes.findIndex((note) => note.id === noteId);
	if (currentNoteIndex === -1) {
		return notes.length === 0 ? null : notes.at(-1) ?? null;
	}

	if (notes.length === 1) return null;

	const prevIndex = currentNoteIndex - 1;
	const nextIndex = currentNoteIndex + 1;
	return notes[prevIndex] ?? notes[nextIndex] ?? null;
};

export type WorkspaceData = {
	id: string;

	activeNote: NoteId | null;
	openedNotes: INote[];
	notes: INote[];

	tags: {
		selected: string | null;
		list: IResolvedTag[];
	};
};

export type WorkspacesState = {
	activeWorkspace: string | null;
	workspaces: WorkspaceData[];
};

// TODO: replace to profiles slice with workspaces
export const workspacesSlice = createSlice({
	name: 'workspaces',
	initialState: {
		activeWorkspace: null,
		workspaces: [],
	} as WorkspacesState,
	reducers: {
		setWorkspaces: (state, { payload }: PayloadAction<WorkspaceData[]>) => {
			return { ...state, workspaces: payload } as WorkspacesState;
		},

		setActiveWorkspace: (state, { payload }: PayloadAction<string | null>) => {
			return { ...state, activeWorkspace: payload } as WorkspacesState;
		},

		setActiveNote: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ noteId: NoteId | null }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			const { noteId } = payload;

			// Set null and avoid array iterating
			if (noteId === null) {
				workspace.activeNote = noteId;
				return;
			}

			// Skip if note is not opened
			const isOpenedNote = workspace.openedNotes.some((note) => note.id === noteId);
			if (!isOpenedNote) return;

			workspace.activeNote = noteId;
		},

		setNotes: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ notes: INote[] }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			workspace.notes = payload.notes;
		},

		addOpenedNote: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ note: INote }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			const { note } = payload;

			const foundNoteInList = workspace.openedNotes.find(
				({ id }) => id === note.id,
			);

			// Ignore already exists note
			if (foundNoteInList) return;

			workspace.openedNotes.push(note);
		},

		removeOpenedNote: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ noteId: NoteId }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			const { noteId } = payload;
			const { activeNote, openedNotes } = workspace;

			const filteredNotes = openedNotes.filter(({ id }) => id !== noteId);

			workspace.activeNote =
				activeNote !== noteId
					? activeNote
					: findNearNote(openedNotes, activeNote)?.id ?? null;
			workspace.openedNotes =
				filteredNotes.length !== openedNotes.length ? filteredNotes : openedNotes;
		},

		updateOpenedNote: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ note: INote }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			const { note } = payload;
			const { openedNotes } = workspace;

			// Ignore not exists notes
			const noteIndex = openedNotes.findIndex(({ id }) => id === note.id);
			if (noteIndex === -1) return;

			workspace.openedNotes = [
				...openedNotes.slice(0, noteIndex),
				note,
				...openedNotes.slice(noteIndex + 1),
			];
		},

		setOpenedNotes: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ notes: INote[] }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			workspace.openedNotes = payload.notes;
		},

		setSelectedTag: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ tag: string | null }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			workspace.tags.selected = payload.tag;

			// Reset selected if no tag exist
			const isSelectedTagExists = workspace.tags.list.some(
				({ id }) => id === workspace.tags.selected,
			);
			if (!isSelectedTagExists) {
				workspace.tags.selected = null;
			}
		},

		setTags: (
			state,
			{ payload }: PayloadAction<WorkspaceScoped<{ tags: IResolvedTag[] }>>,
		) => {
			const workspace = state.workspaces.find(
				(workspace) => workspace.id === payload.workspace,
			);
			if (!workspace) return;

			workspace.tags.list = payload.tags;

			// Reset selected if no tag exist
			const isSelectedTagExists = workspace.tags.list.some(
				({ id }) => id === workspace.tags.selected,
			);
			if (!isSelectedTagExists) {
				workspace.tags.selected = null;
			}
		},
	},
	selectors: {
		selectActiveWorkspace: (state) => state.activeWorkspace,
	},
});

export const { selectActiveWorkspace } = workspacesSlice.selectors;

export const workspacesApi = workspacesSlice.actions;

export type WorkspaceScope = {
	profileId: string;
	workspaceId: string;
};

export const selectWorkspace = (workspaceId: string) =>
	createAppSelector(workspacesSlice.selectSlice, ({ workspaces }) => {
		return workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
	});

export const createWorkspaceSelector = <T>(
	selectorConstructor: (
		workspaceSelector: Selector<RootState, WorkspaceData | null>,
	) => T,
) => {
	return (scope: WorkspaceScope) => {
		const workspaceSelector = selectWorkspace(scope.workspaceId);
		return selectorConstructor(workspaceSelector);
	};
};

export const selectTags = createWorkspaceSelector((selectWorkspace) =>
	createAppSelector([selectWorkspace], (workspace) => {
		if (!workspace) return [];

		return workspace.tags.list;
	}),
);

export const selectTagsTree = createWorkspaceSelector((selectWorkspace) =>
	createAppSelector([selectWorkspace], (workspace) => {
		if (!workspace) return [];

		const flatTags = workspace.tags.list;

		const tagsMap: Record<string, TagItem> = {};
		const tagToParentMap: Record<string, string> = {};

		// Fill maps
		flatTags.forEach(({ id, name, parent }) => {
			tagsMap[id] = {
				id,
				content: name,
			};

			if (parent !== null) {
				tagToParentMap[id] = parent;
			}
		});

		// Attach tags to parents
		for (const tagId in tagToParentMap) {
			const parentId = tagToParentMap[tagId];

			const tag = tagsMap[tagId];
			const parentTag = tagsMap[parentId];

			// Create array
			if (!parentTag.childrens) {
				parentTag.childrens = [];
			}

			// Attach tag to another tag
			parentTag.childrens.push(tag);
		}

		// Delete nested tags from tags map
		Object.keys(tagToParentMap).forEach((nestedTagId) => {
			delete tagsMap[nestedTagId];
		});

		// Collect tags array from a map
		return Object.values(tagsMap);
	}),
);

export const selectActiveNoteId = createWorkspaceSelector((selectWorkspace) =>
	createAppSelector([selectWorkspace], (workspace) => {
		if (!workspace) return null;

		return workspace.activeNote ?? null;
	}),
);

export const selectNote = (noteId: string | null) =>
	createWorkspaceSelector((selectWorkspace) =>
		createAppSelector([selectWorkspace], (workspace) => {
			if (!workspace) return null;
			if (!noteId) return null;

			const { notes } = workspace;

			return notes.find((note) => note.id === noteId) ?? null;
		}),
	);

export const selectActiveNote = createWorkspaceSelector((selectWorkspace) =>
	createAppSelector([selectWorkspace], (workspace) => {
		if (!workspace) return null;

		const { activeNote } = workspace;
		if (!activeNote) return null;

		const { notes } = workspace;

		return notes.find((note) => note.id === activeNote) ?? null;
	}),
);

export const selectActiveTag = createWorkspaceSelector((selectWorkspace) =>
	createAppSelector([selectWorkspace], (workspace) => {
		if (!workspace) return null;

		const currentTag = workspace.tags.selected;
		if (!currentTag) return null;

		return workspace.tags.list.find((tag) => tag.id === currentTag) ?? null;
	}),
);

export const selectNotes = createWorkspaceSelector((selectWorkspace) =>
	createAppSelector([selectWorkspace], (workspace) => {
		if (!workspace) return [];
		return workspace.notes;
	}),
);

export const selectOpenedNotes = createWorkspaceSelector((selectWorkspace) =>
	createAppSelector([selectWorkspace], (workspace) => {
		if (!workspace) return [];
		return workspace.openedNotes;
	}),
);
