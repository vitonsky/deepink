import ms from 'ms';

import { ProfileData } from '../profiles';
import { createVaultSelector } from '../utils';

const selectVault = (state: ProfileData | null) => {
	if (!state) throw new Error('Vault selector is used out of vault context');
	return state;
};

export const selectVaultConfig = createVaultSelector(
	[selectVault],
	(vault) => vault.config,
);

export const selectSnapshotSettings = createVaultSelector(
	[selectVaultConfig],
	(config) => config.snapshots,
);

export const selectDeletionConfig = createVaultSelector(
	[selectVaultConfig],
	(config) => config.deletion,
);
export const selectBinRetentionPolicy = createVaultSelector(
	[selectDeletionConfig],
	(config) => ({
		...config.bin,
		cleanIntervalInMs: ms(`${config.bin.cleanInterval}d`),
	}),
);

export const selectWorkspacesSummary = createVaultSelector([selectVault], (vault) =>
	Object.values(vault.workspaces)
		.values()
		.filter((i) => i !== undefined)
		.map(({ id, name }) => ({ id, name }))
		.toArray(),
);
