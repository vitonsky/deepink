import { useCallback } from 'react';
import { createStandaloneToast } from '@chakra-ui/react';

export const { toast } = createStandaloneToast();

/**
 * Hook for displaying an error toast notification when a profile fails to open
 */
export const useVaultOpenErrorToast = () => {
	const show = useCallback((id: string, profileName: string) => {
		if (!toast.isActive(id)) {
			toast({
				id,
				status: 'error',
				title: 'Cannot open profile',
				description: `"${profileName}" failed to open`,
				containerStyle: {
					maxW: '350px',
				},
			});
		}
	}, []);

	const close = useCallback((id: string) => {
		if (toast.isActive(id)) {
			toast.close(id);
		}
	}, []);

	return { show, close };
};
