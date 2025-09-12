import { useEffect } from 'react';

import { CommandEvent, useCommandEvent } from './CommandEventProvider';
import { GLOBAL_COMMANDS } from '.';

/**
 * Returns a function that calls a command by name
 */
export function useCallNamedCommand() {
	const event = useCommandEvent();

	return <T extends GLOBAL_COMMANDS>(command: T) => {
		event({ id: command });
	};
}

/**
 * Subscribes to command by its name
 *
 * Calls the provided callback whenever the given command is triggered
 */
export function useCommandSubscription(
	command: GLOBAL_COMMANDS,
	callback: (data: CommandEvent) => void,
) {
	const commandEvent = useCommandEvent();

	useEffect(() => {
		const unsubscribe = commandEvent.watch((data) => {
			if (data.id !== command) return;
			callback(data);
		});

		return () => unsubscribe();
	}, [callback, commandEvent, command]);
}
