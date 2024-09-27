import React, { createContext, FC, PropsWithChildren } from 'react';
import { ButtonsManagerObject, useButtonsManager } from '@api/buttons/useButtonsManager';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const StatusBarManagerContext = createContext<ButtonsManagerObject | null>(null);
export const useStatusBarManager = createContextGetterHook(StatusBarManagerContext);

export const StatusBarContext = createContext<ButtonsManagerObject['state']>({
	start: [],
	end: [],
});
export const useStatusBar = createContextGetterHook(StatusBarContext);

export const StatusBarProvider: FC<PropsWithChildren> = ({ children }) => {
	const buttonsManager = useButtonsManager();

	return (
		<StatusBarContext.Provider value={buttonsManager.state}>
			<StatusBarManagerContext.Provider value={buttonsManager}>
				{children}
			</StatusBarManagerContext.Provider>
		</StatusBarContext.Provider>
	);
};
