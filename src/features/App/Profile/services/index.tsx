import { useAutoLock } from './useAutoLock';
import { useBinService } from './useBinService';
import { useFilesIntegrityService } from './useFilesIntegrityService';

export const ProfileServices = () => {
	useAutoLock();

	useBinService();
	useFilesIntegrityService();

	return null;
};
