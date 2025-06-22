import React, { createContext, FC, useMemo } from 'react';
import { createEvent } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

const commandPayloadMap = {
	createNote: undefined,
	closeNote: undefined,
	openClosedNote: undefined,
	lockProfile: undefined,
} as const;

export type CommandPayloadMap = typeof commandPayloadMap;

export type CommandName = keyof CommandPayloadMap;

export type CommandEventPayload<
	K extends keyof CommandPayloadMap = keyof CommandPayloadMap,
> = CommandPayloadMap[K] extends undefined
	? { id: K }
	: { id: K; payload: CommandPayloadMap[K] };

/**
 * Creates events from command name
 */
function createCommandEvents<K extends CommandName>(
	commands: readonly K[],
): {
	[P in K]: ReturnType<typeof createEvent<CommandEventPayload<P>>>;
} {
	const events = {} as {
		[P in K]: ReturnType<typeof createEvent<CommandEventPayload<P>>>;
	};

	commands.forEach((key) => {
		events[key] = createEvent<CommandEventPayload<typeof key>>();
	});

	return events;
}

const CommandEventsContext = createContext<ReturnType<
	typeof createCommandEvents<keyof CommandPayloadMap>
> | null>(null);
export const useCommandEvents = createContextGetterHook(CommandEventsContext);

export const CommandEventsProvider: FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const commandNames = Object.keys(commandPayloadMap) as CommandName[];
	const commandEvents = useMemo(
		() => createCommandEvents(commandNames),
		[commandNames],
	);

	return (
		<CommandEventsContext.Provider value={commandEvents}>
			{children}
		</CommandEventsContext.Provider>
	);
};
