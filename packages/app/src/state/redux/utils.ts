import { addListener, createSelector } from '@reduxjs/toolkit';

import { AppDispatch, RootState } from './store';

export const addStoreListener = addListener.withTypes<RootState, AppDispatch>();

export const createAppSelector = createSelector.withTypes<RootState>();
