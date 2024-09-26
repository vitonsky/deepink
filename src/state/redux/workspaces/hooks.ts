import { Selector } from '@reduxjs/toolkit';

import { useAppSelector } from '../hooks';
import { RootState } from '../store';
import { WorkspaceScope } from './workspaces';

export const useWorkspaceSelector = <T>(
	selectorGetter: (scope: WorkspaceScope) => Selector<RootState, T>,
) => {
	const selector = selectorGetter({ workspaceId: 'default', profileId: 'default' });
	return useAppSelector(selector);
};
