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
