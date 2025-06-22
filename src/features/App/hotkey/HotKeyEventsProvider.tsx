import React, { createContext, FC, useMemo } from 'react';
import { createEvent } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

const commandNames = [
	'createNote',
	'closeNote',
	'openClosedNote',
	'lockProfile',
] as const;

export type CommandPayloadMap = {
	createNote: undefined;
	closeNote: undefined;
	openClosedNote: undefined;
	lockProfile: undefined;
};

export type CommandName = (typeof commandNames)[number];

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
	const commandEvents = useMemo(() => createCommandEvents(commandNames), []);

	return (
		<CommandEventsContext.Provider value={commandEvents}>
			{children}
		</CommandEventsContext.Provider>
	);
};
