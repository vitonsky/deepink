import React, { createContext, FC, PropsWithChildren, useState } from 'react';
import { createEvent } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { CommandPayloads } from '.';

export type CommandBus<CommandPayloads extends Record<string, unknown>> = {
	/**
	 * Fire command by its name and provide payload if needed
	 */
	call: <K extends keyof CommandPayloads>(
		commandName: K,
		...args: CommandPayloads[K] extends void
			? [payload?: void]
			: [payload: CommandPayloads[K]]
	) => void;

	/**
	 * Add listener for a specific command
	 */
	handle: <K extends keyof CommandPayloads>(
		commandName: K,
		callback: (payload: CommandPayloads[K]) => void,
	) => () => void;
};

export const CommandBusContext = createContext<CommandBus<CommandPayloads> | null>(null);
export const useCommandBusContext = createContextGetterHook(CommandBusContext);

export const CommandBusProvider: FC<PropsWithChildren> = ({ children }) => {
	const [commandBus] = useState(() => {
		const commandEvent = createEvent<{
			name: string;
			payload: any;
		}>();

		return {
			call(commandName: string, payload?: any) {
				commandEvent({ name: commandName, payload });
			},
			handle(commandName, callback) {
				return commandEvent.watch((event) => {
					if (event.name !== commandName) return;

					callback(event.payload);
				});
			},
		} satisfies CommandBus<CommandPayloads>;
	});

	return (
		<CommandBusContext.Provider value={commandBus}>
			{children}
		</CommandBusContext.Provider>
	);
};
