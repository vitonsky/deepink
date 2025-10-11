import { useContext } from 'react';

import { CommandContext } from './CommandProvider';
import { CommandPayloadsMap } from '.';

/**
 * Provides a function that triggers a command event
 */
export const useCommand = () => {
	const commandEvent = useContext(CommandContext);

	return <K extends keyof CommandPayloadsMap>(
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
	};
};
