import { useEffect } from 'react';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { createAppSelector } from '@state/redux/utils';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectIsWorkspaceConfigLoaded } from '@state/redux/vaults/selectors/workspaceLoadingStatus';
import { selectWorkspace } from '@state/redux/vaults/vaults';

import { createWorkspaceConfigFile } from '../utils/workspaceFiles';

export const useWorkspaceConfigSync = () => {
	const workspaceData = useWorkspaceData();
	const watchSelector = useWatchSelector();
	const workspaceStorage = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));

	const isWorkspaceConfigLoaded = useWorkspaceSelector(selectIsWorkspaceConfigLoaded);
	useEffect(() => {
		// Config must be loaded before syncing to persistent store to avoid overwriting it with default values
		if (!isWorkspaceConfigLoaded) return;

		const workspaceConfig = createWorkspaceConfigFile(workspaceStorage);

		return watchSelector({
			selector: createAppSelector(
				selectWorkspace(workspaceData),
				(workspace) => workspace?.config,
			),
			onChange(config) {
				if (!config) return;

				workspaceConfig.set(config);
			},
		});
	}, [workspaceStorage, watchSelector, workspaceData, isWorkspaceConfigLoaded]);
};
