import React, { createContext, FC, PropsWithChildren } from 'react';
import { createEvent, EventCallable } from 'effector';

import { CommandPayloadsMap } from '.';

export type CommandEvent<K extends keyof CommandPayloadsMap = keyof CommandPayloadsMap> =
	CommandPayloadsMap[K] extends void
		? {
				name: K;
		  }
		: {
				name: K;
				payload: CommandPayloadsMap[K];
		  };

export const CommandContext = createContext<EventCallable<CommandEvent>>(createEvent());

export const CommandProvider: FC<PropsWithChildren> = ({ children }) => {
	const commandEvent = createEvent<CommandEvent>();

	return (
		<CommandContext.Provider value={commandEvent}>{children}</CommandContext.Provider>
	);
};
