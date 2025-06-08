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

export type CommandEvent<K extends keyof CommandPayloadMap = keyof CommandPayloadMap> =
	CommandPayloadMap[K] extends undefined
		? { id: K }
		: { id: K; payload: CommandPayloadMap[K] };

function createEvents() {
	// TODO: auto create event
	const createNote = createEvent<CommandEvent<'createNote'>>();
	const closeNote = createEvent<CommandEvent<'closeNote'>>();
	const lockProfile = createEvent<CommandEvent<'lockProfile'>>();
	const reopenClosedNote = createEvent<CommandEvent<'reopenClosedNote'>>();

	return {
		createNote,
		closeNote,
		lockProfile,
		reopenClosedNote,
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
