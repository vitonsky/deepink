import React, { createContext, FC, PropsWithChildren } from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { GLOBAL_COMMANDS } from '.';

export type CommandEvent = {
	name: GLOBAL_COMMANDS;
};

const CommandEventContext = createContext<EventCallable<CommandEvent> | null>(null);
export const useCommandEvent = createContextGetterHook(CommandEventContext);

export const CommandEventProvider: FC<PropsWithChildren> = ({ children }) => {
	const commandEvent = createEvent<CommandEvent>();

	return (
		<CommandEventContext.Provider value={commandEvent}>
			{children}
		</CommandEventContext.Provider>
	);
};
