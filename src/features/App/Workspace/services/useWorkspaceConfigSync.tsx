import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
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

	useEffect(() => {
		const workspaceConfig = new StateFile(
			new FileController(
				`workspaces/${workspaceData.workspaceId}/config.json`,
				files,
			),
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
	}, [files, profileId, watchSelector, workspaceData.workspaceId]);
};
