import { createSelector } from '@reduxjs/toolkit';

import { WorkspaceData } from './workspaces';

export const createWorkspaceSelector = createSelector.withTypes<WorkspaceData>();

export const selectWorkspaceRoot = (workspace: WorkspaceData | null) => workspace;
