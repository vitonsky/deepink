import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { useProfileControls } from '.';

export const VaultErrorContext = createContext<{
	handleError: (error: Error) => void;
} | null>(null);
export const useVaultError = createContextGetterHook(VaultErrorContext);

export const VaultErrorProvider: FC<PropsWithChildren> = ({ children }) => {
	const telemetry = useTelemetryTracker();

	const vaultControls = useProfileControls();

	const toast = useToast();
	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			vaultControls.close();

			toast({
				status: 'error',
				isClosable: true,
				title: 'Failed to open vault',
				description: `"${vaultControls.profile.profile.name}" appears to be corrupted.`,
				containerStyle: { maxW: '400px' },
			});

			telemetry.track(TELEMETRY_EVENT_NAME.PROFILE_OPEN_FAILED);
		},
		[telemetry, toast, vaultControls],
	);

	return (
		<VaultErrorContext.Provider value={{ handleError }}>
			{children}
		</VaultErrorContext.Provider>
	);
};
