import React, { createContext, FC, PropsWithChildren } from 'react';
import { createEvent, EventCallable } from 'effector';

import { CommandPayloadsMap } from '.';

export type Command<K extends keyof CommandPayloadsMap = keyof CommandPayloadsMap> =
	CommandPayloadsMap[K] extends void
		? {
				name: K;
		  }
		: {
				name: K;
				payload: CommandPayloadsMap[K];
		  };

export const CommandEventContext = createContext<EventCallable<Command>>(createEvent());

export const CommandEventProvider: FC<PropsWithChildren> = ({ children }) => {
	const commandEvent = createEvent<Command>();

	return (
		<CommandEventContext.Provider value={commandEvent}>
			{children}
		</CommandEventContext.Provider>
	);
};
