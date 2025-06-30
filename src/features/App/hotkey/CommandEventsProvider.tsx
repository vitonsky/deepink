import React, { createContext, FC, useMemo } from 'react';
import { createEvent, EventCallable } from 'effector';
import { ShortcutCommand } from '@state/redux/settings/settings';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type CommandEventPayload = {
	id: ShortcutCommand;
	payload?: {};
};

const CommandEventsContext = createContext<EventCallable<CommandEventPayload> | null>(
	null,
);
export const useCommandEvent = createContextGetterHook(CommandEventsContext);

export const CommandEventsProvider: FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	// Creates event from command name
	const commandEvent = useMemo(() => createEvent<CommandEventPayload>(), []);

	return (
		<CommandEventsContext.Provider value={commandEvent}>
			{children}
		</CommandEventsContext.Provider>
	);
};
