import { useEffect } from 'react';
import { isEqual } from 'lodash';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useAppSelector } from '@state/redux/hooks';
import {
	ProfileConfigScheme,
	selectProfile,
	selectWorkspace,
	selectWorkspacesInfo,
	WorkspaceConfigScheme,
} from '@state/redux/profiles/profiles';
import { createAppSelector } from '@state/redux/utils';

import { useProfileControls } from '..';

export const useVaultConfigSync = () => {
	const {
		profile: {
			files,
			profile: { id: profileId },
		},
	} = useProfileControls();

	const watchSelector = useWatchSelector();
	useEffect(() => {
		const vaultConfig = new StateFile(
			new FileController('config.json', files),
			ProfileConfigScheme,
		);

		return watchSelector({
			selector: createAppSelector(
				selectProfile({ profileId }),
				(profile) => profile?.config,
			),
			onChange(config) {
				if (!config) return;

				vaultConfig.set(config).then(() => {
					console.debug('Vault config is saved');
				});
			},
		});
	}, [files, profileId, watchSelector]);

	const workspaces = useAppSelector(selectWorkspacesInfo({ profileId }), isEqual);
	useEffect(() => {
		const cleanups = workspaces
			.filter((workspace) => workspace.touched)
			.map((workspace) => {
				const workspaceConfig = new StateFile(
					new FileController(`workspaces/${workspace.id}/config.json`, files),
					WorkspaceConfigScheme,
				);

				return watchSelector({
					selector: createAppSelector(
						selectWorkspace({ profileId, workspaceId: workspace.id }),
						(workspace) => workspace?.config,
					),
					onChange(config) {
						if (!config) return;

						workspaceConfig.set(config).then(() => {
							console.debug('Workspace config is saved');
						});
					},
				});
			});

		return () => cleanups.forEach((cleanup) => cleanup());
	}, [files, profileId, watchSelector, workspaces]);
};
