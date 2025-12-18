import z from 'zod';
import { INote, NoteId } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';
import { findNearNote } from './utils';

type ProfileMutator<T extends {}> = (profile: ProfileData, payload: T) => void;

export const defaultVaultConfig = {
	filesIntegrity: {
		enabled: false,
	},
	snapshots: {
		enabled: true,
		interval: 30_000,
	},
	deletion: {
		confirm: false,
		permanentDeletion: false,
		bin: {
			autoClean: false,
			cleanInterval: 30,
		},
	},
} satisfies ProfileConfig;

export function createProfileReducer<T extends {} = {}>(mutator: ProfileMutator<T>) {
	return (state: ProfilesState, { payload }: PayloadAction<ProfileScoped<T>>) => {
		const { profileId, ...rest } = payload;
		const profile = state.profiles[profileId];
		if (profile) {
			mutator(profile, rest as unknown as T);
		}
	};
}

const selectWorkspaceObject = (
	state: ProfilesState,
	{ profileId, workspaceId }: WorkspaceScoped,
) => {
	const profile = state.profiles[profileId];
	if (!profile) return null;

	return profile.workspaces[workspaceId] ?? null;
};

export enum NOTES_VIEW {
	All_NOTES = 'All notes',
	BIN = 'Bin',
	BOOKMARK = 'Bookmark',
	ARCHIVE = 'Archive',
}

export const createWorkspaceObject = (workspace: {
	id: string;
	name: string;
}): WorkspaceData => ({
	...workspace,
	touched: false,

	activeNote: null,
	recentlyClosedNotes: [],
	openedNotes: [],
	notes: [],

	search: '',

	view: NOTES_VIEW.All_NOTES,

	tags: {
		selected: null,
		list: [],
	},

	config: {
		newNote: {
			title: 'Untitled - {date:D MMM YYYY, HH:mm}',
			tags: 'selected',
		},
	},
});

export type ProfileScoped<T extends {} = {}> = T & {
	profileId: string;
};
export type WorkspaceScoped<T extends {} = {}> = T &
	ProfileScoped<{
		workspaceId: string;
	}>;

export const WorkspaceConfigScheme = z.object({
	newNote: z.object({
		title: z.string(),
		tags: z.union([z.literal('none'), z.literal('selected')]),
	}),
});

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
	recentlyClosedNotes: NoteId[];
	openedNotes: INote[];
	notes: INote[];

	search: string;

	view: NOTES_VIEW;

	tags: {
		selected: string | null;
		list: IResolvedTag[];
	};

	config: z.output<typeof WorkspaceConfigScheme>;
};

export const ProfileConfigScheme = z.object({
	filesIntegrity: z.object({
		enabled: z.boolean(),
	}),
	snapshots: z.object({
		enabled: z.boolean(),
		interval: z.number(),
	}),
	deletion: z.object({
		confirm: z.boolean(),
		permanentDeletion: z.boolean(),
		bin: z.object({
			autoClean: z.boolean(),
			cleanInterval: z.number(),
		}),
	}),
});

export type ProfileConfig = z.output<typeof ProfileConfigScheme>;

export enum PROFILE_SCREEN_MODE {
	LOCK = 'lockProfileScreen',
	CHANGE = 'changeProfileScreen',
	CREATE = 'createProfileScreen',
}

export type ProfileData = {
	activeWorkspace: string | null;
	workspaces: Record<string, WorkspaceData | undefined>;

	config: ProfileConfig;
};

export type ProfilesState = {
	activeProfile: string | null;
	profiles: Record<string, ProfileData | undefined>;
	profileScreenMode: PROFILE_SCREEN_MODE | null;
};

export const profilesSlice = createSlice({
	name: 'profiles',
	initialState: {
		activeProfile: null,
		profiles: {},
		profileScreenMode: null,
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

		setProfileScreenMode: (
			state,
			{ payload }: PayloadAction<PROFILE_SCREEN_MODE>,
		) => {
			state.profileScreenMode = payload;
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

			const filteredClosedNotes = workspace.recentlyClosedNotes.filter(
				(id) => id !== note.id,
			);
			if (workspace.recentlyClosedNotes.length !== filteredClosedNotes.length) {
				workspace.recentlyClosedNotes = filteredClosedNotes;
			}
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
					: (findNearNote(openedNotes, activeNote)?.id ?? null);
			workspace.openedNotes =
				filteredNotes.length !== openedNotes.length ? filteredNotes : openedNotes;

			workspace.recentlyClosedNotes.push(noteId);
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
		setView: (
			state,
			{
				payload: { profileId, workspaceId, view },
			}: PayloadAction<WorkspaceScoped<{ view: NOTES_VIEW }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
			if (!workspace) return;

			workspace.view = view;
		},

		setWorkspaceNoteTemplateConfig: (
			state,
			{
				payload: { profileId, workspaceId, ...props },
			}: PayloadAction<
				WorkspaceScoped<Partial<WorkspaceData['config']['newNote']>>
			>,
		) => {
			const workspace = selectWorkspaceObject(state, { profileId, workspaceId });
			if (!workspace) return;

			workspace.config.newNote = { ...workspace.config.newNote, ...props };
		},

		setSnapshotsConfig: createProfileReducer(
			(profile, payload: Partial<ProfileData['config']['snapshots']>) => {
				profile.config.snapshots = {
					...profile.config.snapshots,
					...payload,
				};
			},
		),

		setNoteDeletionConfig: createProfileReducer(
			(
				profile,
				payload: Partial<
					Pick<
						ProfileData['config']['deletion'],
						'permanentDeletion' | 'confirm'
					>
				>,
			) => {
				profile.config.deletion = {
					...profile.config.deletion,
					...payload,
				};
			},
		),
		setBinAutoDeletionConfig: createProfileReducer(
			(profile, payload: Partial<ProfileData['config']['deletion']['bin']>) => {
				profile.config.deletion.bin = {
					...profile.config.deletion.bin,
					...payload,
				};
			},
		),
		setFilesIntegrityConfig: createProfileReducer(
			(profile, payload: Partial<ProfileData['config']['filesIntegrity']>) => {
				profile.config.filesIntegrity = {
					...profile.config.filesIntegrity,
					...payload,
				};
			},
		),
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

export const selectProfileScreenMode = createAppSelector(
	profilesSlice.selectSlice,
	(state) => state.profileScreenMode,
);

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
