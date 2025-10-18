import { INote, NoteId } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';
import { findNearNote } from './utils';

const selectWorkspaceObject = (
	state: ProfilesState,
	{ profileId, workspaceId }: WorkspaceScoped,
) => {
	const profile = state.profiles[profileId];
	if (!profile) return null;

	return profile.workspaces[workspaceId] ?? null;
};

export const createWorkspaceObject = (workspace: {
	id: string;
	name: string;
}): WorkspaceData => ({
	...workspace,
	touched: false,

	activeNote: null,
	openedNotes: [],
	notes: [],

	search: '',

	tags: {
		selected: null,
		list: [],
	},
});

export type ProfileScoped<T extends {} = {}> = T & {
	profileId: string;
};
export type WorkspaceScoped<T extends {} = {}> = T &
	ProfileScoped<{
		workspaceId: string;
	}>;

export type WorkspaceData = {
	id: string;
	name: string;

	/**
	 * Defines were workspace opened by user or not
	 *
	 * Not touched workspaces will not be rendered,
	 * to optimize performance
	 */
	touched: boolean;

	activeNote: NoteId | null;
	openedNotes: INote[];
	notes: INote[];

	search: string;

	tags: {
		selected: string | null;
		list: IResolvedTag[];
	};
};

export type ProfileData = {
	activeWorkspace: string | null;
	workspaces: Record<string, WorkspaceData | undefined>;
};

export type ProfilesState = {
	activeProfile: string | null;
	profiles: Record<string, ProfileData | undefined>;
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
			state.activeProfile = payload;
		},

		setWorkspaces: (
			state,
			{
				payload: { profileId, workspaces },
			}: PayloadAction<
				ProfileScoped<{ workspaces: Record<string, WorkspaceData> }>
			>,
		) => {
			const profile = state.profiles[profileId];
			if (!profile) return;

			profile.workspaces = workspaces;
		},

		setActiveWorkspace: (
			state,
			{
				payload: { profileId, workspaceId },
			}: PayloadAction<ProfileScoped<{ workspaceId: string | null }>>,
		) => {
			const profile = state.profiles[profileId];
			if (!profile) return;

			profile.activeWorkspace = workspaceId;

			// Touch workspace
			if (workspaceId) {
				const workspace = profile.workspaces[workspaceId];
				if (workspace && !workspace.touched) {
					workspace.touched = true;
				}
			}
		},

		setActiveNote: (
			state,
			{
				payload: { profileId, workspaceId, noteId },
			}: PayloadAction<WorkspaceScoped<{ noteId: NoteId | null }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
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
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
			if (!workspace) return;

			workspace.notes = notes;
		},

		addOpenedNote: (
			state,
			{
				payload: { profileId, workspaceId, note },
			}: PayloadAction<WorkspaceScoped<{ note: INote }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
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
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
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
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
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
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
			if (!workspace) return;

			workspace.openedNotes = notes;
		},

		setSelectedTag: (
			state,
			{
				payload: { profileId, workspaceId, tag },
			}: PayloadAction<WorkspaceScoped<{ tag: string | null }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
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
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
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

		setSearch: (
			state,
			{
				payload: { profileId, workspaceId, search },
			}: PayloadAction<WorkspaceScoped<{ search: string }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
			if (!workspace) return;

			workspace.search = search;
		},
	},
});

export const workspacesApi = profilesSlice.actions;

export const selectActiveProfile = createAppSelector(
	profilesSlice.selectSlice,
	(state) => {
		return state.activeProfile ?? null;
	},
);

export const selectProfile = ({ profileId }: ProfileScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		const profile = state.profiles[profileId];
		return profile ?? null;
	});

export const selectWorkspaces = ({ profileId }: ProfileScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		const profile = state.profiles[profileId];
		if (!profile) return [];

		return Object.values(profile.workspaces ?? {}).filter(Boolean) as WorkspaceData[];
	});

/**
 * Workspace info subset that will be persistent for notes changes
 */
export const getWorkspaceInfo = ({ id, name, touched }: WorkspaceData) => ({
	id,
	name,
	touched,
});

export const selectWorkspacesInfo = (scope: ProfileScoped) =>
	createAppSelector(selectWorkspaces(scope), (workspaces) =>
		workspaces.map(getWorkspaceInfo),
	);

export const selectWorkspace = ({ profileId, workspaceId }: WorkspaceScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		const profile = state.profiles[profileId];
		if (!profile) return null;

		return profile.workspaces[workspaceId] ?? null;
	});

export const selectActiveWorkspace = ({ profileId }: ProfileScoped) =>
	createAppSelector(profilesSlice.selectSlice, (state) => {
		const profile = state.profiles[profileId];
		if (!profile || !profile.activeWorkspace) return null;

		return profile.workspaces[profile.activeWorkspace] ?? null;
	});

export const selectActiveWorkspaceInfo = (scope: ProfileScoped) =>
	createAppSelector(selectActiveWorkspace(scope), (workspace) =>
		workspace ? getWorkspaceInfo(workspace) : null,
	);

export * from './selectors/notes';
export * from './selectors/tags';
