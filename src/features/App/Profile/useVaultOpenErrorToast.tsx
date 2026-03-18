import { useCallback, useEffect, useRef } from 'react';
import { createStandaloneToast } from '@chakra-ui/react';
import { useAppSelector } from '@state/redux/hooks';
import { selectActiveProfile } from '@state/redux/profiles/profiles';

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

	// Close error message while changed vault
	const currentProfile = useAppSelector(selectActiveProfile);
	const prevVaultId = useRef(currentProfile);
	useEffect(() => {
		if (prevVaultId.current && prevVaultId.current !== currentProfile) {
			close(prevVaultId.current);
		}
		prevVaultId.current = currentProfile;
	}, [close, currentProfile]);

	return { show, close };
};
