import { useEffect, useRef, useState } from 'react';
import { ConfigStorage } from '@core/storage/ConfigStorage';

export const useRecentVault = (config: ConfigStorage) => {
	const [vaultId, setVaultId] = useState<{
		isLoaded: boolean;
		vaultId: string | null;
	}>({
		isLoaded: false,
		vaultId: null,
	});

	// Restore
	const isRestoredRef = useRef(false);
	useEffect(() => {
		if (isRestoredRef.current) return;

		config.get('activeVault').then((activeVault) => {
			isRestoredRef.current = true;
			setVaultId({
				isLoaded: true,
				vaultId: activeVault,
			});
		});
	}, [config]);

	return vaultId;
};
