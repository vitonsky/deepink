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
				? [payload?: undefined]
				: [payload: CommandPayloadsMap[K]]
		) => {
			const [payload] = args;
			const data =
				payload === undefined
					? { name: commandName }
					: {
							name: commandName,
							payload,
					  };
			commandEvent(data);
		},
		[commandEvent],
	);
};
