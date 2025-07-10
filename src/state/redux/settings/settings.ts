import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export type GlobalSettings = {
	editorMode: EditorMode;
	theme: 'zen' | 'light';
	isPermanentDeleteNotes: boolean;
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: {
		editorMode: 'plaintext',
		theme: 'zen',
		isPermanentDeleteNotes: false,
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
		setIsPermanentDeleteNotes: (
			state,
			{ payload }: PayloadAction<GlobalSettings['isPermanentDeleteNotes']>,
		) => {
			return { ...state, isPermanentDeleteNotes: payload } as GlobalSettings;
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

export const selectIsPermanentDeleteNotes = createAppSelector(
	selectSettings,
	(setting) => setting.isPermanentDeleteNotes,
);
