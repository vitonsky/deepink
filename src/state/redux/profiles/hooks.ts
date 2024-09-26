import { useMemo } from 'react';
import { Selector } from '@reduxjs/toolkit';

import { useAppSelector } from '../hooks';
import { selectWorkspace, WorkspaceData } from './profiles';

export const useWorkspaceData = () => {
	return useMemo(
		() => ({
			profileId: 'default',
			workspaceId: 'default',
		}),
		[],
	);
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
