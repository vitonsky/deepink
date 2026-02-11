import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { FileControllerWithEncryption } from '@core/features/files/FileControllerWithEncryption';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { selectProfile } from '@state/redux/profiles/profiles';
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
			encryptionController,
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
				new FileControllerWithEncryption(
					new FileController('state.json', files),
					encryptionController,
				),
				vaultStateScheme.partial(),
			),
	);

	const watchSelector = useWatchSelector();
	useEffect(() => {
		if (!sync) return;

		return watchSelector({
			selector: createAppSelector(selectProfile({ profileId }), (state) => {
				if (!state) return null;

				const { activeWorkspace } = state;

				return { activeWorkspace };
			}),
			onChange(state) {
				if (!state) return;

				vaultState.set(state);
			},
		});
	}, [files, profileId, sync, vaultState, watchSelector]);

	return useCallback(() => vaultState.get(), [vaultState]);
};
