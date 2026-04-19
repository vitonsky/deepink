import { useCallback, useEffect } from 'react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectActiveVault, workspacesApi } from '@state/redux/vaults/vaults';

export const useActiveVaultId = (config: ConfigStorage) => {
	const dispatch = useAppDispatch();

	const currentVaultId = useAppSelector(selectActiveVault);
	const setCurrentVaultId = useCallback(
		(vaultId: string | null) => {
			dispatch(workspacesApi.setActiveVault(vaultId));
		},
		[dispatch],
	);

	// Write recent vault to config
	useEffect(() => {
		if (currentVaultId !== null) {
			config.set('activeVault', currentVaultId);
		}
	}, [config, currentVaultId]);

	return [currentVaultId, setCurrentVaultId] as const;
};
