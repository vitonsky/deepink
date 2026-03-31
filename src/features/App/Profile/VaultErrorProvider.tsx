import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { useToastNotification } from '@components/useToastNotification';
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
	const { show: showErrorToast } = useToastNotification();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			vaultControls.close();

			showErrorToast({
				title: 'Failed to open vault',
				description: `"${vaultControls.profile.profile.name}" appears to be corrupted.`,
			});

			telemetry.track(TELEMETRY_EVENT_NAME.PROFILE_OPEN_FAILED);
		},
		[showErrorToast, telemetry, vaultControls],
	);

	return (
		<VaultErrorContext.Provider value={{ handleError }}>
			{children}
		</VaultErrorContext.Provider>
	);
};
