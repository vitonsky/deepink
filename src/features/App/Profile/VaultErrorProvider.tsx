import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
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
	const { t } = useTranslation(LOCALE_NAMESPACE.vault);
	const telemetry = useTelemetryTracker();
	const toast = useToast();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			controls.close();

			toast({
				status: 'error',
				isClosable: true,
				title: t('errors.failedToOpen'),
				description: t('errors.corrupted', {
					name: controls.profile.profile.name,
				}),
				containerStyle: { maxW: '400px' },
			});

			telemetry.track(TELEMETRY_EVENT_NAME.VAULT_OPEN_FAILED);
		},
		[controls, t, telemetry, toast],
	);

	return (
		<VaultErrorContext.Provider value={handleError}>
			{children}
		</VaultErrorContext.Provider>
	);
};
