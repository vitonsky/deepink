import { INote, NoteId } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

// TODO: select workspace in profile
export const { selectActiveWorkspace } = workspacesSlice.selectors;

export const workspacesApi = workspacesSlice.actions;

export const selectWorkspace = (workspaceId: string) =>
	createAppSelector(workspacesSlice.selectSlice, ({ workspaces }) => {
		return workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
	});

export * from './selectors/notes';
export * from './selectors/tags';
