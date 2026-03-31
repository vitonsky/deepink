import { useEffect } from 'react';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { selectIsWorkspaceConfigLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createAppSelector } from '@state/redux/utils';

import { createWorkspaceStateFiles } from '../utils/createWorkspaceStateFiles';

export const useWorkspaceConfigSync = () => {
	const workspaceData = useWorkspaceData();
	const watchSelector = useWatchSelector();
	const isWorkspaceConfigRestored = useWorkspaceSelector(selectIsWorkspaceConfigLoaded);

	const workspaceStorage = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		if (!isWorkspaceConfigRestored) return;

		const { workspaceConfig } = createWorkspaceStateFiles(workspaceStorage);

		return watchSelector({
			selector: createAppSelector(
				selectWorkspace(workspaceData),
				(workspace) => workspace?.config,
			),
			onChange(config) {
				if (!config) return;

				workspaceConfig.set(config).then(() => {
					console.debug('Workspace config is saved');
				});
			},
		});
	}, [workspaceStorage, watchSelector, workspaceData, isWorkspaceConfigRestored]);
};
