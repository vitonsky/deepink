import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectWorkspace, WorkspaceConfigScheme } from '@state/redux/profiles/profiles';
import { selectIsWorkspaceConfigLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createAppSelector } from '@state/redux/utils';

export const useWorkspaceConfigSync = () => {
	const workspaceData = useWorkspaceData();
	const watchSelector = useWatchSelector();
	const isWorkspaceConfigRestored = useWorkspaceSelector(selectIsWorkspaceConfigLoaded);

	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		if (!isWorkspaceConfigRestored) return;

		const workspaceConfig = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

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
	}, [workspaceFiles, watchSelector, workspaceData, isWorkspaceConfigRestored]);
};
