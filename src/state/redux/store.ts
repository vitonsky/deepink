import { configureStore } from '@reduxjs/toolkit';

import { workspacesSlice } from './workspaces';

export const store = configureStore({
	reducer: {
		workspaces: workspacesSlice.reducer,
	},
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
