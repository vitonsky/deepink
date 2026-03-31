import { useEffect } from 'react';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectWorkspaceState } from '@state/redux/profiles/selectors/selectWorkspaceState';
import { selectIsWorkspaceLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createAppSelector } from '@state/redux/utils';

import { createWorkspaceStateFiles } from '../utils/createWorkspaceStateFiles';

export const useWorkspaceStateSync = () => {
	const workspaceData = useWorkspaceData();
	const watchSelector = useWatchSelector();
	const workspaceStorage = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));

	const isWorkspaceLoaded = useWorkspaceSelector(selectIsWorkspaceLoaded);
	useEffect(() => {
		// Workspace data must be loaded before syncing to persistent store to avoid overwriting it with default values
		if (!isWorkspaceLoaded) return;

		const { workspaceState } = createWorkspaceStateFiles(workspaceStorage);

		return watchSelector({
			selector: createAppSelector(
				selectWorkspaceState(workspaceData),
				(state) => state,
			),
			onChange(state) {
				if (!state) return;

				workspaceState.set(state);
			},
		});
	}, [isWorkspaceLoaded, watchSelector, workspaceData, workspaceStorage]);
};
