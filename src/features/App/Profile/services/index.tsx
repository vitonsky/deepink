import { useBinService } from './useBinService';
import { useFilesIntegrityService } from './useFilesIntegrityService';

export const ProfileServices = () => {
	useBinService();
	useFilesIntegrityService();

	return null;
};
