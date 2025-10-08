import React, {
	createContext,
	FC,
	PropsWithChildren,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { ContextMenu } from './ContextMenu';

export type ContextMenuPayload<T = string> = {
	position: { x: number; y: number };
	items: ContextMenu<T>;
	onAction: (actionId: T) => void;
};

const ContextMenuContext = createContext<{
	show: EventCallable<ContextMenuPayload>;
}>(null as any);
export const useContextMenuProvider = createContextGetterHook(ContextMenuContext);

export const ContextMenuProvider: FC<PropsWithChildren> = ({ children }) => {
	const [context] = useState(() => ({ show: createEvent<ContextMenuPayload>() }));
	const [menuState, setMenuState] = useState<ContextMenuPayload | null>(null);

	const toggleMenu = useCallback((payload: ContextMenuPayload) => {
		setMenuState((prev) => (prev ? null : payload));
	}, []);

	useEffect(() => {
		return context.show.watch(toggleMenu);
	}, [context, toggleMenu]);

	const closeMenu = useCallback(() => setMenuState(null), []);

	return (
		<ContextMenuContext.Provider value={context}>
			{children}
			{menuState && (
				<ContextMenu
					items={menuState.items}
					position={menuState.position}
					isOpen={Boolean(menuState)}
					onAction={(actionId) => {
						menuState.onAction(actionId);
						closeMenu();
					}}
					onClose={closeMenu}
				/>
			)}
		</ContextMenuContext.Provider>
	);
};
