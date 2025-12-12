import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export enum PROFILE_SCREEN_MODE {
	LOCK = 'lockScreen',
	CHANGE = 'changeProfileScreen',
}

export type GlobalSettings = {
	editorMode: EditorMode;
	theme: 'zen' | 'light';
	preferences: {
		/**
		 * Indicates if a confirmation is required before moving note to the bin
		 */
		confirmBeforeMoveToBin: boolean;
	};
	profileScreenMode: PROFILE_SCREEN_MODE | null;
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: {
		editorMode: 'plaintext',
		theme: 'zen',
		preferences: {
			confirmBeforeMoveToBin: false,
		},
		profileScreenMode: null,
	} as GlobalSettings,
	reducers: {
		setSettings: (state, { payload }: PayloadAction<Partial<GlobalSettings>>) => {
			return { ...state, ...payload } as GlobalSettings;
		},
		setEditorMode: (
			state,
			{ payload }: PayloadAction<GlobalSettings['editorMode']>,
		) => {
			return { ...state, editorMode: payload } as GlobalSettings;
		},
		setTheme: (state, { payload }: PayloadAction<GlobalSettings['theme']>) => {
			return { ...state, theme: payload } as GlobalSettings;
		},
		setPreferences: (
			state,
			{ payload }: PayloadAction<GlobalSettings['preferences']>,
		) => {
			return { ...state, preferences: payload } as GlobalSettings;
		},
		setProfileScreenMode: (
			state,
			{ payload }: PayloadAction<GlobalSettings['profileScreenMode']>,
		) => {
			return { ...state, profileScreenMode: payload } as GlobalSettings;
		},
	},
});

export const settingsApi = settingsSlice.actions;

export const selectSettings = settingsSlice.selectSlice;

export const selectEditorMode = createAppSelector(
	selectSettings,
	(settings) => settings.editorMode,
);

export const selectTheme = createAppSelector(
	selectSettings,
	(settings) => settings.theme,
);
