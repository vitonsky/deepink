import { useContext, useEffect } from 'react';

import { CommandContext, CommandEvent } from './CommandProvider';
import { CommandPayloadsMap } from '.';

export function hasCommandPayload<K extends keyof CommandPayloadsMap>(
	command: CommandEvent<K>,
): command is { name: K; payload: CommandPayloadsMap[K] } {
	return 'payload' in command;
}

/**
 * Subscribes to a command event by its name and cleans up automatically
 *
 * Optionally, the subscription can be disabled using the `enabled` flag.
 */

export const useCommandCallback = <K extends keyof CommandPayloadsMap>(
	commandName: K,
	callback: (payload?: CommandPayloadsMap[K]) => void,
	options?: { enabled?: boolean },
) => {
	const commandEvent = useContext(CommandContext);

	useEffect(() => {
		if (!options?.enabled) return;

		return commandEvent.watch((event) => {
			if (event.name !== commandName) return;

			hasCommandPayload(event) ? callback(event.payload) : callback();
		});
	}, [callback, commandName, commandEvent, options?.enabled]);
};
