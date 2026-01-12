import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export type GlobalSettings = {
	editorMode: EditorMode;
	theme: 'zen' | 'light';
	editor: {
		fontFamily: string;
		fontSize: number;
		lineHeight: number;
		miniMap: boolean;
		lineNumbers: boolean;
	};
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
		editor: {
			fontFamily:
				// eslint-disable-next-line spellcheck/spell-checker
				'-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Segoe UI Variable", "Noto Sans", "Ubuntu", "Cantarell", "Helvetica Neue", Arial, system-ui, sans-serif',
			fontSize: 18,
			lineHeight: 1.5,
			miniMap: false,
			lineNumbers: false,
		},
		preferences: {
			confirmBeforeMoveToBin: false,
		},
	} satisfies GlobalSettings as GlobalSettings,
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
