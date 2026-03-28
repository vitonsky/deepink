import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { useVaultOpenErrorToast } from './useVaultOpenErrorToast';
import { useProfileControls } from '.';

export const VaultErrorContext = createContext<{
	handleError: (error: Error) => void;
} | null>(null);

export const useVaultError = createContextGetterHook(VaultErrorContext);

export const VaultErrorHandlerProvider: FC<PropsWithChildren> = ({ children }) => {
	const vaultControls = useProfileControls();
	const { show: showErrorToast } = useVaultOpenErrorToast();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			vaultControls.close();

			showErrorToast(
				vaultControls.profile.profile.id,
				vaultControls.profile.profile.name,
			);
		},
		[showErrorToast, vaultControls],
	);

	return (
		<VaultErrorContext.Provider value={{ handleError }}>
			{children}
		</VaultErrorContext.Provider>
	);
};
