import { useCallback } from 'react';
import { createStandaloneToast } from '@chakra-ui/react';

export const { toast } = createStandaloneToast();

export const useVaultOpenErrorToast = () => {
	const show = useCallback((id: string, title: string) => {
		if (!toast.isActive(id)) {
			toast({
				id,
				status: 'error',
				title,
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
