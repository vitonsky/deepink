import React, { createContext, FC, useMemo } from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { SHORTCUT_COMMANDS } from './shortcuts';

export type CommandEvent = {
	id: SHORTCUT_COMMANDS;
};

const ShortcutEventContext = createContext<EventCallable<CommandEvent> | null>(null);
export const useCommandEvent = createContextGetterHook(ShortcutEventContext);

export const CommandEventProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
	const commandEvent = useMemo(() => createEvent<CommandEvent>(), []);

	return (
		<ShortcutEventContext.Provider value={commandEvent}>
			{children}
		</ShortcutEventContext.Provider>
	);
};
