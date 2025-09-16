import { useEffect } from 'react';

import { CommandEvent, useCommandEvent } from './CommandEventProvider';
import { GLOBAL_COMMANDS } from '.';

/**
 * Registers a listener for the specified command
 *
 * Calls the provided callback whenever the given command is triggered
 */
export function useCommandListener(
	command: GLOBAL_COMMANDS,
	callback: (data: CommandEvent) => void,
) {
	const commandEvent = useCommandEvent();

	useEffect(() => {
		return commandEvent.watch((data) => {
			if (data.id !== command) return;
			callback(data);
		});
	}, [callback, commandEvent, command]);
}
