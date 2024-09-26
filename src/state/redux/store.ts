import { configureStore } from '@reduxjs/toolkit';

import { profilesSlice, WorkspaceData } from './profiles/profiles';

export const store = configureStore({
	reducer: {
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
