import { useMemo } from 'react';
import { useWorkspaceContext } from '@features/Workspace';
import { Selector } from '@reduxjs/toolkit';

import { useAppSelector } from '../hooks';
import { selectWorkspace, WorkspaceData } from './profiles';

export const useWorkspaceData = () => {
	const { profileId, workspaceId } = useWorkspaceContext();
	return useMemo(() => ({ profileId, workspaceId }), [profileId, workspaceId]);
};

// Select profile and workspace from context
export const useWorkspaceRootSelector = () => {
	const { profileId, workspaceId } = useWorkspaceData();

	return useMemo(
		() => selectWorkspace({ profileId, workspaceId }),
		[profileId, workspaceId],
	);
};

export const useWorkspaceSelector = <T>(
	selector: Selector<WorkspaceData | null, T>,
): T => {
	const selectWorkspace = useWorkspaceRootSelector();
	const state = useAppSelector(selectWorkspace);

	return selector(state);
};
