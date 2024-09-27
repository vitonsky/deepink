import { INote, NoteId } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';
import { findNearNote } from './utils';

export type ProfileScoped<T extends {} = {}> = T & {
	profileId: string;
};
export type WorkspaceScoped<T extends {} = {}> = T &
	ProfileScoped<{
		workspaceId: string;
	}>;

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

export type ProfileData = {
	activeWorkspace: string | null;
	workspaces: Record<string, WorkspaceData>;
};

export type ProfilesState = {
	activeProfile: string | null;
	profiles: Record<string, ProfileData>;
};

export const profilesSlice = createSlice({
	name: 'profiles',
	initialState: {
		activeProfile: null,
		profiles: {},
	} as ProfilesState,
	reducers: {
		setProfiles: (state, { payload }: PayloadAction<Record<string, ProfileData>>) => {
			return { ...state, profiles: payload } as ProfilesState;
		},

		addProfile: (
			state,
			{
				payload: { profileId, profile },
			}: PayloadAction<{ profileId: string; profile: ProfileData }>,
		) => {
			state.profiles[profileId] = profile;
		},

		removeProfile: (
			state,
			{ payload: { profileId } }: PayloadAction<{ profileId: string }>,
		) => {
			delete state.profiles[profileId];
		},

		setActiveProfile: (state, { payload }: PayloadAction<string | null>) => {
			return { ...state, activeProfile: payload } as ProfilesState;
		},

		setWorkspaces: (
			state,
			{
				payload: { profileId, workspaces },
			}: PayloadAction<
				ProfileScoped<{ workspaces: Record<string, WorkspaceData> }>
			>,
		) => {
			state.profiles[profileId].workspaces = workspaces;
		},

		setActiveWorkspace: (
			state,
			{
				payload: { profileId, workspaceId },
			}: PayloadAction<ProfileScoped<{ workspaceId: string | null }>>,
		) => {
			state.profiles[profileId].activeWorkspace = workspaceId;
		},

		setActiveNote: (
			state,
			{
				payload: { profileId, workspaceId, noteId },
			}: PayloadAction<WorkspaceScoped<{ noteId: NoteId | null }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

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
			{
				payload: { profileId, workspaceId, notes },
			}: PayloadAction<WorkspaceScoped<{ notes: INote[] }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

			workspace.notes = notes;
		},

		addOpenedNote: (
			state,
			{
				payload: { profileId, workspaceId, note },
			}: PayloadAction<WorkspaceScoped<{ note: INote }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

			const foundNoteInList = workspace.openedNotes.find(
				({ id }) => id === note.id,
			);

			// Ignore already exists note
			if (foundNoteInList) return;

			workspace.openedNotes.push(note);
		},

		removeOpenedNote: (
			state,
			{
				payload: { profileId, workspaceId, noteId },
			}: PayloadAction<WorkspaceScoped<{ noteId: NoteId }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

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
			{
				payload: { profileId, workspaceId, note },
			}: PayloadAction<WorkspaceScoped<{ note: INote }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

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
			{
				payload: { profileId, workspaceId, notes },
			}: PayloadAction<WorkspaceScoped<{ notes: INote[] }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

			workspace.openedNotes = notes;
		},

		setSelectedTag: (
			state,
			{
				payload: { profileId, workspaceId, tag },
			}: PayloadAction<WorkspaceScoped<{ tag: string | null }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

			workspace.tags.selected = tag;

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
			{
				payload: { profileId, workspaceId, tags },
			}: PayloadAction<WorkspaceScoped<{ tags: IResolvedTag[] }>>,
		) => {
			const workspace = state.profiles[profileId].workspaces[workspaceId];
			if (!workspace) return;

			workspace.tags.list = tags;

			// Reset selected if no tag exist
			const isSelectedTagExists = workspace.tags.list.some(
				({ id }) => id === workspace.tags.selected,
			);
			if (!isSelectedTagExists) {
				workspace.tags.selected = null;
			}
		},
	},
});

export const workspacesApi = profilesSlice.actions;

export const selectProfile = ({ profileId }: ProfileScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		return state.profiles[profileId] ?? null;
	});

export const selectWorkspaces = ({ profileId }: ProfileScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		return Object.values(state.profiles[profileId]?.workspaces ?? {});
	});

export const selectWorkspace = ({ profileId, workspaceId }: WorkspaceScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		return state.profiles[profileId].workspaces[workspaceId] ?? null;
	});

export const selectActiveWorkspace = ({ profileId }: ProfileScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		const profile = state.profiles[profileId];
		if (!profile || !profile.activeWorkspace) return null;

		return profile.workspaces[profile.activeWorkspace] ?? null;
	});

export * from './selectors/notes';
export * from './selectors/tags';
