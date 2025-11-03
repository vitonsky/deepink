import { useCallback, useContext } from 'react';

import { CommandEventContext } from './CommandEventProvider';
import { CommandPayloadsMap } from '.';

/**
 * Provides a function that triggers a command event
 */
export const useCommand = () => {
	const commandEvent = useContext(CommandEventContext);

	return useCallback(
		<K extends keyof CommandPayloadsMap>(
			commandName: K,
			...args: CommandPayloadsMap[K] extends void
				? [payload?: void]
				: [payload: CommandPayloadsMap[K]]
		) => {
			const [payload] = args;
			commandEvent({ name: commandName, payload });
		},
		[commandEvent],
	);
};
