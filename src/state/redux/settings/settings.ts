import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export type Hotkeys = {
	createNote: string;
	lockProfile: string;
	closeNote: string;
	openClosedNote: string;
};

export type GlobalSettings = {
	editorMode: EditorMode;
	theme: 'zen' | 'light';
	hotkeys: Hotkeys;
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: {
		editorMode: 'plaintext',
		theme: 'zen',
		hotkeys: {
			createNote: 'ctrl+n',
			lockProfile: 'ctrl+l',
			closeNote: 'ctrl+w',
			openClosedNote: 'ctrl+shift+t',
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
		setHotkeys: (state, { payload }: PayloadAction<GlobalSettings['hotkeys']>) => {
			return { ...state, hotkeys: payload } as GlobalSettings;
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

export const selectHotkeys = createAppSelector(
	selectSettings,
	(settings) => settings.hotkeys,
);
