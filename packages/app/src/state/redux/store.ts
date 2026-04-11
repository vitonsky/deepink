import { configureStore } from '@reduxjs/toolkit';

import { profilesSlice, WorkspaceData } from './profiles/profiles';
import { settingsSlice } from './settings/settings';

export const store = configureStore({
	reducer: {
		settings: settingsSlice.reducer,
		profiles: profilesSlice.reducer,
	},
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export type WorkspaceContextState = {
	root: RootState;
	workspace: WorkspaceData | null;
};
