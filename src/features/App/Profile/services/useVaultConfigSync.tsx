import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/telemetry/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { ProfileConfigScheme, selectProfile } from '@state/redux/profiles/profiles';
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
				console.debug('Update vault config');
				vaultConfig.set(config);
			},
		});
	}, [files, profileId, watchSelector]);
};
