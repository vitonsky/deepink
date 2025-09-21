import React, { createContext, FC, PropsWithChildren } from 'react';
import { createEvent, EventCallable } from 'effector';

import { GLOBAL_COMMANDS } from '.';

// In the future, we can define a type for the payload like this:
// type CommandPayloads = { [GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE]: { profileId: string }; }
export type CommandPayloads = {
	[K in GLOBAL_COMMANDS]: unknown;
};

export type CommandEvent<K extends keyof CommandPayloads = keyof CommandPayloads> = {
	name: K;
	payload: CommandPayloads[K] extends void ? undefined : CommandPayloads[K];
};

export const CommandEventContext = createContext<EventCallable<CommandEvent> | null>(
	null,
);

export const CommandEventProvider: FC<PropsWithChildren> = ({ children }) => {
	const commandEvent = createEvent<CommandEvent>();

	return (
		<CommandEventContext.Provider value={commandEvent}>
			{children}
		</CommandEventContext.Provider>
	);
};
