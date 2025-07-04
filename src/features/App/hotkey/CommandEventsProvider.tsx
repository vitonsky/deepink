import React, { createContext, FC, useMemo } from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { GLOBAL_COMMANDS } from './shortcuts';

export type CommandEvent = {
	id: GLOBAL_COMMANDS;
};

const CommandEventContext = createContext<EventCallable<CommandEvent> | null>(null);
export const useCommandEvent = createContextGetterHook(CommandEventContext);

export const CommandEventProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
	const commandEvent = useMemo(() => createEvent<CommandEvent>(), []);

	return (
		<CommandEventContext.Provider value={commandEvent}>
			{children}
		</CommandEventContext.Provider>
	);
};
