import { useContext, useEffect } from 'react';

import { CommandEventContext } from './CommandEventProvider';
import { CommandPayloadsMap } from '.';

/**
 * Subscribes to a command event by its name and cleans up automatically
 *
 * Optionally, the subscription can be disabled using the `enabled` flag.
 */
export const useCommandCallback = <K extends keyof CommandPayloadsMap>(
	commandName: K,
	callback: (payload: CommandPayloadsMap[K]) => void,
	{ enabled = true }: { enabled?: boolean } = {},
) => {
	const commandEvent = useContext(CommandEventContext);

	useEffect(() => {
		if (!enabled) return;

		return commandEvent.watch((event) => {
			if (event.name !== commandName) return;

			callback(event.payload as CommandPayloadsMap[K]);
		});
	}, [callback, commandName, commandEvent, enabled]);
};
