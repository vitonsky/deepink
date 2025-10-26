import { useContext, useEffect } from 'react';

import { Command, CommandEventContext } from './CommandEventProvider';
import { CommandPayloadsMap } from '.';

export function hasCommandPayload<K extends keyof CommandPayloadsMap>(
	command: Command<K>,
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
	{ enabled = true }: { enabled?: boolean } = {},
) => {
	const commandEvent = useContext(CommandEventContext);

	useEffect(() => {
		if (!enabled) return;

		return commandEvent.watch((event) => {
			if (event.name !== commandName) return;

			hasCommandPayload(event) ? callback(event.payload) : callback();
		});
	}, [callback, commandName, commandEvent, enabled]);
};
