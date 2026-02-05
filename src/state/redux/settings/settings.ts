import { accentColorsMap } from '@features/ThemeProvider';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export type GlobalSettings = {
	editorMode: EditorMode;
	theme: {
		name: 'auto' | 'light' | 'dark' | 'zen';
		accentColor?: string;
	};
	editor: {
		fontFamily: string;
		fontSize: number;
		lineHeight: number;
		miniMap: boolean;
		lineNumbers: boolean;
		dateFormat: string;
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
		theme: {
			name: 'auto',
			accentColor: 'auto',
		},
		editor: {
			fontFamily: '',
			fontSize: 18,
			lineHeight: 1.5,
			miniMap: false,
			lineNumbers: false,
			dateFormat: 'D MMM YYYY, HH:mm',
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
		setEditorConfig: (
			state,
			{ payload }: PayloadAction<Partial<GlobalSettings['editor']>>,
		) => {
			state.editor = { ...state.editor, ...payload };
		},

		setTheme: (
			state,
			{ payload }: PayloadAction<Partial<GlobalSettings['theme']>>,
		) => {
			const theme = { ...state.theme, ...payload };
			if (!theme.accentColor || !(theme.accentColor in accentColorsMap)) {
				theme.accentColor = 'auto';
			}

			return { ...state, theme } as GlobalSettings;
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
