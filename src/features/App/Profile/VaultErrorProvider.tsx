import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ProfileControls } from '.';

export const VaultErrorContext = createContext<((error: Error) => void) | null>(null);
export const useVaultError = createContextGetterHook(VaultErrorContext);

export const VaultErrorProvider: FC<PropsWithChildren<{ controls: ProfileControls }>> = ({
	controls,
	children,
}) => {
	const telemetry = useTelemetryTracker();
	const toast = useToast();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			controls.close();

			toast({
				status: 'error',
				isClosable: true,
				title: 'Failed to open vault',
				description: `"${controls.profile.profile.name}" appears to be corrupted.`,
				containerStyle: { maxW: '400px' },
			});

			telemetry.track(TELEMETRY_EVENT_NAME.VAULT_OPEN_FAILED);
		},
		[controls, telemetry, toast],
	);

	return (
		<VaultErrorContext.Provider value={handleError}>
			{children}
		</VaultErrorContext.Provider>
	);
};
