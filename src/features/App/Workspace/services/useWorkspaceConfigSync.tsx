import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace, WorkspaceConfigScheme } from '@state/redux/profiles/profiles';
import { createAppSelector } from '@state/redux/utils';

import { useProfileControls } from '../../Profile';

export const useWorkspaceConfigSync = () => {
	const {
		profile: {
			files,
			profile: { id: profileId },
		},
	} = useProfileControls();

	const workspaceData = useWorkspaceData();
	const watchSelector = useWatchSelector();

	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		const workspaceConfig = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

		return watchSelector({
			selector: createAppSelector(
				selectWorkspace({ profileId, workspaceId: workspaceData.workspaceId }),
				(workspace) => workspace?.config,
			),
			onChange(config) {
				if (!config) return;

				workspaceConfig.set(config).then(() => {
					console.debug('Workspace config is saved');
				});
			},
		});
	}, [files, profileId, workspaceFiles, watchSelector, workspaceData.workspaceId]);
};
