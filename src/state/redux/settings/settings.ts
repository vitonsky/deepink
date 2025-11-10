import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export type GlobalSettings = {
	editorMode: EditorMode;
	theme: 'zen' | 'light';
	preferences: {
		/**
		 * Indicates if a confirmation is required before moving note to the bin
		 */
		confirmBeforeMoveToBin: boolean;
	};
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: {
		editorMode: 'plaintext',
		theme: 'zen',
		preferences: {
			confirmBeforeMoveToBin: false,
		},
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

export const selectConfirmMoveToBin = createAppSelector(
	selectSettings,
	(settings) => settings.preferences.confirmBeforeMoveToBin,
);
