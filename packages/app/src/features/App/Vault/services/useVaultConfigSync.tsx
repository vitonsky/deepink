import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { selectVaultById, VaultConfigScheme } from '@state/redux/profiles/profiles';
import { createAppSelector } from '@state/redux/utils';

import { useVaultControls } from '..';

export const useVaultConfigSync = () => {
	const {
		vault: {
			files,
			vault: { id: vaultId },
		},
	} = useVaultControls();

	const watchSelector = useWatchSelector();
	useEffect(() => {
		const vaultConfig = new StateFile(
			new FileController('config.json', files),
			VaultConfigScheme,
		);

		return watchSelector({
			selector: createAppSelector(
				selectVaultById({ vaultId }),
				(vault) => vault?.config,
			),
			onChange(config) {
				if (!config) return;

				vaultConfig.set(config).then(() => {
					console.debug('Vault config is saved');
				});
			},
		});
	}, [files, vaultId, watchSelector]);
};
