import { configureStore } from '@reduxjs/toolkit';

import { settingsSlice } from './settings/settings';
import { vaultsSlice, WorkspaceData } from './vaults/vaults';

export const store = configureStore({
	reducer: {
		settings: settingsSlice.reducer,
		vaults: vaultsSlice.reducer,
	},
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export type WorkspaceContextState = {
	root: RootState;
	workspace: WorkspaceData | null;
};
