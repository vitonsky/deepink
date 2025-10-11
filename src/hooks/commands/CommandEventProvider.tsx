import React, { createContext, FC, PropsWithChildren } from 'react';
import { createEvent, EventCallable } from 'effector';

import { CommandPayloads } from '.';

export type CommandEvent<K extends keyof CommandPayloads = keyof CommandPayloads> =
	CommandPayloads[K] extends void
		? {
				name: K;
		  }
		: {
				name: K;
				payload: CommandPayloads[K];
		  };

export const CommandEventContext = createContext<EventCallable<CommandEvent>>(
	createEvent(),
);

export const CommandBusProvider: FC<PropsWithChildren> = ({ children }) => {
	const commandEvent = createEvent<CommandEvent>();

	return (
		<CommandEventContext.Provider value={commandEvent}>
			{children}
		</CommandEventContext.Provider>
	);
};
