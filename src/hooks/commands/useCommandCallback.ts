import { useEffect } from 'react';

import { useCommandBusContext } from './CommandEventProvider';
import { CommandPayloads } from '.';

/**
 * Subscribes to a command via CommandBus and automatically cleans up.
 *
 * Optionally, the subscription can be disabled using the `enabled` flag.
 */
export function useCommandCallback<K extends keyof CommandPayloads>(
	commandName: K,
	callback: (payload: CommandPayloads[K]) => void,
	options?: { enabled?: boolean },
) {
	const commandBus = useCommandBusContext();

	useEffect(() => {
		if (options && !options.enabled) return;

		return commandBus.listen(commandName, callback);
	}, [commandBus, commandName, callback, options]);
}
