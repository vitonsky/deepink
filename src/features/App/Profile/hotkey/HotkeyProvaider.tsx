import React, { createContext, useMemo } from 'react';
import { createEvent } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

// the example how store key data in setting
// const userHotkeys = {
// 	createNote: 'Control+N',
// 	lockProfile: 'Control+L',
// 	closeNote: 'Control+W',
// 	reopenClosedNote: 'Control+Alt+T',
// };

// TODO: read from redux the hotkey command
export type CommandPayloadMap = {
	closeNote: { noteId: string };
	createNote: {};
	lockProfile: {};
};

export type CommandEvent<K extends keyof CommandPayloadMap = keyof CommandPayloadMap> =
	CommandPayloadMap[K] extends undefined | void
		? { id: K }
		: { id: K; payload?: CommandPayloadMap[K] };

function createEvents() {
	//TODO: auto create event
	const createNoteEvent = createEvent<CommandEvent<'createNote'>>();
	const closeNoteEvent = createEvent<CommandEvent<'closeNote'>>();
	const lockProfileEvent = createEvent<CommandEvent<'lockProfile'>>();

	return {
		createNoteEvent,
		closeNoteEvent,
		lockProfileEvent,
	};
}

const HotKeyEventsContext = createContext<ReturnType<typeof createEvents> | null>(null);
export const useHotKeyEvents = createContextGetterHook(HotKeyEventsContext);

export const HotkeyEventsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const events = useMemo(() => createEvents(), []);
	return (
		<HotKeyEventsContext.Provider value={events}>
			{children}
		</HotKeyEventsContext.Provider>
	);
};
