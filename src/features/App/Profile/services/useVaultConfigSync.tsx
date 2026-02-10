import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useAppSelector } from '@state/redux/hooks';
import {
	ProfileConfigScheme,
	selectProfile,
	selectWorkspace,
	selectWorkspaceConfig,
	selectWorkspacesInfo,
	WorkspaceConfigScheme,
} from '@state/redux/profiles/profiles';
import { selectVaultConfig } from '@state/redux/profiles/selectors/vault';
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
			selector: createAppSelector(selectProfile({ profileId }), selectVaultConfig),
			onChange(config) {
				vaultConfig.set(config).then(() => {
					console.debug('Vault config is saved');
				});
			},
		});
	}, [files, profileId, watchSelector]);

	const workspaces = useAppSelector(selectWorkspacesInfo({ profileId }));
	useEffect(() => {
		const cleanups = workspaces
			.filter((workspace) => workspace.touched)
			.map((workspace) => {
				const workspaceConfig = new StateFile(
					new FileController(`configs/${workspace.id}.json`, files),
					WorkspaceConfigScheme,
				);

				return watchSelector({
					selector: createAppSelector(
						selectWorkspace({ profileId, workspaceId: workspace.id }),
						selectWorkspaceConfig,
					),
					onChange(config) {
						workspaceConfig.set(config).then(() => {
							console.debug('Workspace config is saved');
						});
					},
				});
			});

		return () => cleanups.forEach((cleanup) => cleanup());
	}, [files, profileId, watchSelector, workspaces]);
};
