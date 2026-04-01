import { useCallback } from 'react';
import { createStandaloneToast, UseToastOptions } from '@chakra-ui/react';

const { toast } = createStandaloneToast();

/**
 * Display an toast notifications outside of the React tree
 */
export const useToastNotification = () => {
	/**
	 * Displays a toast and returns its generated id
	 */
	const show = useCallback(({ status = 'error', ...options }: UseToastOptions) => {
		const id = crypto.randomUUID();

		toast({
			...options,
			id,
			status,
			isClosable: true,
			containerStyle: { maxW: '400px' },
		});

		return id;
	}, []);

	const close = useCallback((id: string) => {
		toast.close(id);
	}, []);

	const closeAll = useCallback(() => {
		toast.closeAll();
	}, []);

	return { show, close, closeAll };
};
