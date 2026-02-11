import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { selectProfile } from '@state/redux/profiles/profiles';
import { selectVault } from '@state/redux/profiles/selectors/vault';
import { createAppSelector } from '@state/redux/utils';

import { ProfileControls } from '.';

const vaultStateScheme = z.object({
	activeWorkspace: z.string().nullable(),
});

export const useVaultState = ({
	sync,
	controls: {
		profile: {
			files,
			profile: { id: profileId },
		},
	},
}: {
	sync: boolean;
	controls: ProfileControls;
}) => {
	const [vaultState] = useState(
		() =>
			new StateFile(
				new FileController('state.json', files),
				vaultStateScheme.partial(),
			),
	);

	const watchSelector = useWatchSelector();
	useEffect(() => {
		if (!sync) return;

		return watchSelector({
			selector: createAppSelector(selectProfile({ profileId }), (state) => {
				const vault = selectVault(state);
				const { activeWorkspace } = vault;

				return { activeWorkspace };
			}),
			onChange(state) {
				vaultState.set(state);
			},
		});
	}, [files, profileId, sync, vaultState, watchSelector]);

	return useCallback(() => vaultState.get(), [vaultState]);
};
