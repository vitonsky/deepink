import React, { createContext, FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createEvent } from 'effector';
import { selectHotkeys } from '@state/redux/settings/settings';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type CommandPayloadMap = {
	createNote: undefined;
	closeNote: undefined;
	openClosedNote: undefined;
	lockProfile: undefined;
};

export type CommandEventPayload<
	K extends keyof CommandPayloadMap = keyof CommandPayloadMap,
> = CommandPayloadMap[K] extends undefined
	? { id: K }
	: { id: K; payload: CommandPayloadMap[K] };

/**
 * Creates an event object typed by keys from command
 */
function createEvents<K extends keyof CommandPayloadMap>(
	command: Record<K, string>,
): {
	[P in K]: ReturnType<typeof createEvent<CommandEventPayload<P>>>;
} {
	const events = {} as {
		[P in K]: ReturnType<typeof createEvent<CommandEventPayload<P>>>;
	};

	(Object.keys(command) as Array<K>).forEach((key) => {
		events[key] = createEvent<CommandEventPayload<typeof key>>();
	});

	return events;
}

const HotKeyEventsContext = createContext<ReturnType<
	typeof createEvents<keyof CommandPayloadMap>
> | null>(null);
export const useHotkeyEvents = createContextGetterHook(HotKeyEventsContext);

export const HotKeyEventsProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
	const hotkeysSetting = useSelector(selectHotkeys);

	const events = useMemo(() => createEvents(hotkeysSetting), [hotkeysSetting]);
	return (
		<HotKeyEventsContext.Provider value={events}>
			{children}
		</HotKeyEventsContext.Provider>
	);
};
