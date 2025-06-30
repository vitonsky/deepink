import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export type ShortcutCommand =
	| 'createNote'
	| 'lockProfile'
	| 'closeNote'
	| 'restoreClosedNote';

export type ShortcutMap = Record<string, ShortcutCommand>;

export type GlobalSettings = {
	editorMode: EditorMode;
	theme: 'zen' | 'light';
	shortcuts: ShortcutMap;
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: {
		editorMode: 'plaintext',
		theme: 'zen',
		shortcuts: {
			'ctrl+n': 'createNote',
			'ctrl+l': 'lockProfile',
			'ctrl+w': 'closeNote',
			'ctrl+shift+t': 'restoreClosedNote',
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
		setShortcuts: (
			state,
			{ payload }: PayloadAction<GlobalSettings['shortcuts']>,
		) => {
			return { ...state, shortcuts: payload } as GlobalSettings;
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

export const selectShortcuts = createAppSelector(
	selectSettings,
	(settings) => settings.shortcuts,
);
