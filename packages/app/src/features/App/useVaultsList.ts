import { useCallback, useEffect, useMemo, useState } from 'react';
import { joinBuffers } from '@core/encryption/utils/buffers';
import { bytesToBase64 } from '@core/encryption/utils/encoding';
import { deriveBitsFromPassword, KEY_SALT_BYTES } from '@core/encryption/utils/keys';
import { getRandomBytes } from '@core/encryption/utils/random';
import { createEncryption } from '@core/features/encryption/createEncryption';
import { RootedFS } from '@core/features/files/RootedFS';
import { VaultObject, VaultsManager } from '@core/storage/VaultsManager';
import { useFilesStorage } from '@features/files';

import { NewVault } from './VaultCreator';

export type VaultsListApi = {
	isVaultsLoaded: boolean;
	vaults: VaultObject[];
	createVault: (vault: NewVault) => Promise<VaultObject>;
};

/**
 * Hook to manage vault accounts
 */
export const useVaultsList = (): VaultsListApi => {
	const files = useFilesStorage();
	const vaultsManager = useMemo(
		() =>
			new VaultsManager(
				files,
				(vaultName) => new RootedFS(files, `/vaults/${vaultName}`),
			),
		[files],
	);

	const [vaults, setVaults] = useState<VaultObject[]>([]);
	const [isVaultsLoaded, setIsVaultsLoaded] = useState(false);

	const updateVaults = useCallback(
		() =>
			vaultsManager.getVaults().then((vaults) => {
				setVaults(vaults);
				setIsVaultsLoaded(true);
			}),
		[vaultsManager],
	);

	// Init state
	useEffect(() => {
		updateVaults();
	}, [updateVaults]);

	const createVault = useCallback(
		async (vault: NewVault) => {
			let vaultData;
			if (vault.password === null) {
				// Create vault with no encryption
				vaultData = await vaultsManager.add({
					name: vault.name,
					encryption: null,
				});
			} else {
				// Create encrypted vault
				console.log('Create vault with encryption', vault.algorithm);

				const passwordSalt = getRandomBytes(16);
				const keyPassword = await deriveBitsFromPassword(
					vault.password,
					passwordSalt,
				);

				const key = getRandomBytes(32);
				const keySalt = getRandomBytes(KEY_SALT_BYTES);

				const encryption = await createEncryption({
					key: keyPassword,
					salt: keySalt,
					algorithm: vault.algorithm,
				});

				const encryptedKey = await encryption
					.getContent()
					.encrypt(key.buffer)
					.finally(() => encryption.dispose());

				vaultData = await vaultsManager.add({
					name: vault.name,
					encryption: {
						algorithm: vault.algorithm,
						salt: bytesToBase64(passwordSalt.buffer),
						key: joinBuffers([keySalt.buffer, encryptedKey]),
					},
				});
			}

			await updateVaults();

			return vaultData;
		},
		[vaultsManager, updateVaults],
	);

	return {
		isVaultsLoaded,
		vaults,
		createVault,
	};
};
