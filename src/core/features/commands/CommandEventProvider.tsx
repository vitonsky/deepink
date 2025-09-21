import React, { createContext, FC, PropsWithChildren } from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { GLOBAL_COMMANDS } from '.';

// In the future, we can define a type for the payload like this:
// CommandPayloads = {[GLOBAL_COMMANDS.CREATE_NOTE]: { title: string}}
export type CommandPayloads = {
	[K in GLOBAL_COMMANDS]?: unknown;
};

export type CommandEvent<K extends keyof CommandPayloads = keyof CommandPayloads> = {
	name: K;
	payload: CommandPayloads[K] extends void
		? [payload?: void]
		: [payload: CommandPayloads[K]];
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
