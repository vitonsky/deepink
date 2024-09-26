import { useMemo } from 'react';
import { Selector } from '@reduxjs/toolkit';

import { useAppSelector } from '../hooks';
import { selectWorkspace, WorkspaceData } from './workspaces';

// Select profile and workspace from context
export const useWorkspaceRootSelector = () => {
	const workspace = 'default';
	return useMemo(() => selectWorkspace(workspace), [workspace]);
};

export const useWorkspaceSelector = <T>(
	selector: Selector<WorkspaceData | null, T>,
): T => {
	const selectWorkspace = useWorkspaceRootSelector();
	const state = useAppSelector(selectWorkspace);

	return selector(state);
};
