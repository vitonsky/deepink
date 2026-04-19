import { useAutoLock } from './useAutoLock';
import { useBinService } from './useBinService';
import { useFilesIntegrityService } from './useFilesIntegrityService';
import { useVaultConfigSync } from './useVaultConfigSync';

export const VaultServices = () => {
	useVaultConfigSync();
	useAutoLock();

	useBinService();
	useFilesIntegrityService();

	return null;
};
