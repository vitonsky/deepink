import React, { createContext, FC, PropsWithChildren } from 'react';
import { ButtonsManagerObject, useButtonsManager } from '@api/buttons/useButtonsManager';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const BottomPanelManagerContext = createContext<ButtonsManagerObject | null>(null);
export const useBottomPanelManager = createContextGetterHook(BottomPanelManagerContext);

export const StatusBarContext = createContext<ButtonsManagerObject['state']>({
	start: [],
	end: [],
});
export const useStatusBar = createContextGetterHook(StatusBarContext);

export const StatusBarProvider: FC<PropsWithChildren> = ({ children }) => {
	const buttonsManager = useButtonsManager();

	return (
		<StatusBarContext.Provider value={buttonsManager.state}>
			<BottomPanelManagerContext.Provider value={buttonsManager}>
				{children}
			</BottomPanelManagerContext.Provider>
		</StatusBarContext.Provider>
	);
};
