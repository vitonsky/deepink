import { useCallback } from 'react';
import { createStandaloneToast } from '@chakra-ui/react';

export const { toast } = createStandaloneToast();

/**
 * Display an error toast notification
 */
export const useErrorToast = () => {
	/**
	 * Displays an toast and returns its generated id
	 */
	const show = useCallback(
		({ title, description }: { title: string; description: string }) => {
			const id = crypto.randomUUID();

			toast({
				id,
				status: 'error',
				title,
				description,
				containerStyle: { maxW: '400px' },
			});

			return id;
		},
		[],
	);

	const close = useCallback((id: string) => {
		toast.close(id);
	}, []);

	const closeAll = useCallback(() => {
		toast.closeAll();
	}, []);

	return { show, close, closeAll };
};
