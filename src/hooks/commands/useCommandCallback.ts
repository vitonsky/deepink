import { useContext, useEffect } from 'react';

import { CommandEvent, CommandEventContext } from './CommandEventProvider';
import { CommandPayloads } from '.';

export function hasCommandPayload<K extends keyof CommandPayloads>(
	command: CommandEvent<K>,
): command is { name: K; payload: CommandPayloads[K] } {
	return 'payload' in command;
}

/**
 * Subscribes to a command via CommandBus and automatically cleans up.
 *
 * Optionally, the subscription can be disabled using the `enabled` flag.
 */

export function useCommandCallback<K extends keyof CommandPayloads>(
	commandName: K,
	callback: (payload?: CommandPayloads[K]) => void,
	options?: { enabled?: boolean },
) {
	const commandEvent = useContext(CommandEventContext);

	useEffect(() => {
		if (!options?.enabled) return;

		return commandEvent.watch((event) => {
			if (event.name !== commandName) return;

			hasCommandPayload(event) ? callback(event.payload) : callback();
		});
	}, [callback, commandName, commandEvent, options?.enabled]);
}
