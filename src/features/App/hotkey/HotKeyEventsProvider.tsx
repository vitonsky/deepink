import React, { createContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createEvent } from 'effector';
import { Hotkeys, selectHotkeys } from '@state/redux/settings/settings';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

// TODO: read from redux the hotkey command
export type CommandPayloadMap = {
	createNote: undefined;
	closeNote: { noteId: string };
	reopenClosedNote: { noteId: string };
	lockProfile: undefined;
};

export type CommandEventPayload<
	K extends keyof CommandPayloadMap = keyof CommandPayloadMap,
> = CommandPayloadMap[K] extends undefined
	? { id: K }
	: { id: K; payload: CommandPayloadMap[K] };

type EventsMap = {
	[K in keyof CommandPayloadMap]: ReturnType<
		typeof createEvent<CommandEventPayload<K>>
	>;
};

function createEvents(command: Hotkeys) {
	const events = {} as EventsMap;

	for (const key of Object.keys(command) as (keyof CommandPayloadMap)[]) {
		switch (key) {
			case 'createNote': {
				events[key] = createEvent<CommandEventPayload<typeof key>>();
				break;
			}
			case 'closeNote': {
				events[key] = createEvent<CommandEventPayload<typeof key>>();
				break;
			}
			case 'reopenClosedNote': {
				events[key] = createEvent<CommandEventPayload<typeof key>>();
				break;
			}
			case 'lockProfile': {
				events[key] = createEvent<CommandEventPayload<typeof key>>();
				break;
			}
		}
	}
	return events;
}

const HotKeyEventsContext = createContext<EventsMap | null>(null);
export const useHotkeyEvents = createContextGetterHook(HotKeyEventsContext);

export const HotKeyEventsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const hotkeysSetting = useSelector(selectHotkeys);

	const events = useMemo(() => createEvents(hotkeysSetting), [hotkeysSetting]);
	return (
		<HotKeyEventsContext.Provider value={events}>
			{children}
		</HotKeyEventsContext.Provider>
	);
};
