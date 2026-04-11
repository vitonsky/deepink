import { useCallback, useMemo } from 'react';
import { useToast, UseToastOptions } from '@chakra-ui/react';

export const useStandaloneToast = (toastId: string) => {
	const toast = useToast();

	const close = useCallback(() => {
		toast.close(toastId);
	}, [toast, toastId]);

	const show = useCallback(
		(options?: UseToastOptions) => {
			toast.close(toastId);
			requestAnimationFrame(() => {
				toast({
					...options,
					id: toastId,
				});
			});
		},
		[toast, toastId],
	);

	return useMemo(() => ({ close, show }), [close, show]);
};
