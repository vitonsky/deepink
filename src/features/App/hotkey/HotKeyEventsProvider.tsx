import React, { createContext, useMemo } from 'react';
import { createEvent } from 'effector';
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

function createEvents() {
	// TODO: auto create event
	const createNote = createEvent<CommandEventPayload<'createNote'>>();
	const closeNote = createEvent<CommandEventPayload<'closeNote'>>();
	const lockProfile = createEvent<CommandEventPayload<'lockProfile'>>();
	const reopenClosedNote = createEvent<CommandEventPayload<'reopenClosedNote'>>();

	return {
		createNote,
		closeNote,
		lockProfile,
		reopenClosedNote,
	};
}

const HotKeyEventsContext = createContext<ReturnType<typeof createEvents> | null>(null);
export const useHotkeyEvents = createContextGetterHook(HotKeyEventsContext);

export const HotKeyEventsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const events = useMemo(() => createEvents(), []);
	return (
		<HotKeyEventsContext.Provider value={events}>
			{children}
		</HotKeyEventsContext.Provider>
	);
};
