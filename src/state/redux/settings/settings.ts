import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type GlobalSettings = {
	editorMode: 'plaintext' | 'richtext' | 'split-screen';
	theme: 'zen' | 'light';
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: {
		editorMode: 'plaintext',
		theme: 'zen',
	} as GlobalSettings,
	reducers: {
		setEditorMode: (
			state,
			{ payload }: PayloadAction<GlobalSettings['editorMode']>,
		) => {
			return { ...state, editorMode: payload } as GlobalSettings;
		},
		setTheme: (state, { payload }: PayloadAction<GlobalSettings['theme']>) => {
			return { ...state, theme: payload } as GlobalSettings;
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
