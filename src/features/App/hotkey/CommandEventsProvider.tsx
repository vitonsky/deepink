import React, { createContext, FC, useMemo } from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { SHORTCUT_COMMANDS } from './shortcuts';

export type CommandEvent = {
	id: SHORTCUT_COMMANDS;
};

const CommandEventsContext = createContext<EventCallable<CommandEvent> | null>(null);
export const useCommandEvent = createContextGetterHook(CommandEventsContext);

export const CommandEventsProvider: FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const commandEvent = useMemo(() => createEvent<CommandEvent>(), []);

	return (
		<CommandEventsContext.Provider value={commandEvent}>
			{children}
		</CommandEventsContext.Provider>
	);
};
