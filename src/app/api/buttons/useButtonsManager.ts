import { createContext, useContext, useRef, useState } from 'react';

import { ButtonObject, ButtonsManager } from '.';

export type ButtonsManagerObject = {
	readonly manager: ButtonsManager;
	readonly state: {
		left: ButtonObject[];
		right: ButtonObject[];
	};
};

export const useButtonsManager = (): ButtonsManagerObject => {
	const [state, setState] = useState<ButtonsManagerObject['state']>({
		left: [],
		right: [],
	});

	const managerRef = useRef<ButtonsManager>(null as unknown as ButtonsManager);
	if (!managerRef.current) {
		managerRef.current = new ButtonsManager((buttons) => {
			setState({
				left: buttons.start.map((button) => button.button),
				right: buttons.end.map((button) => button.button),
			});
		});
	}

	return { state, manager: managerRef.current };
};

export const BottomPanelButtonsManagerContext = createContext<ButtonsManagerObject>(
	null as unknown as ButtonsManagerObject,
);

export const useBottomPanelButtonsManager = () => {
	return useContext(BottomPanelButtonsManagerContext);
};
