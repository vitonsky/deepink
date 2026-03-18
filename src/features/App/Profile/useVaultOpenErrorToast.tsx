import { useCallback } from 'react';
import { createStandaloneToast } from '@chakra-ui/react';

export const { toast } = createStandaloneToast();

export const useVaultOpenErrorToast = () => {
	const show = useCallback((id: string, message: string) => {
		if (!toast.isActive(id)) {
			toast({
				id,
				status: 'error',
				title: 'Cannot open profile',
				description: message,
				containerStyle: {
					maxW: '400px',
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
