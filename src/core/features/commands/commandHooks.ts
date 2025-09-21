import { useEffect } from 'react';

import { CommandEvent, useCommandEvent } from './CommandEventProvider';
import { GLOBAL_COMMANDS } from '.';

/**
 * Returns a function that calls a command by its name
 */
export function useCommand() {
	const commandEvent = useCommandEvent();

	return <T extends GLOBAL_COMMANDS>(name: T) => {
		commandEvent({ name });
	};
}

/**
 * Calls the provided callback whenever the given command is triggered
 */
export function useCommandCallback(
	command: GLOBAL_COMMANDS,
	callback: (data: CommandEvent) => void,
) {
	const commandEvent = useCommandEvent();

	useEffect(() => {
		return commandEvent.watch((data) => {
			if (data.name !== command) return;
			callback(data);
		});
	}, [callback, commandEvent, command]);
}
