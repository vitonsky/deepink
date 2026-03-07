import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { ProfileConfigScheme, selectProfile } from '@state/redux/profiles/profiles';
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
};
