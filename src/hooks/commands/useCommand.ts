import { useContext } from 'react';

import { CommandEventContext, CommandPayloads } from './CommandEventProvider';

/**
 * Returns a function that calls a command by its name
 */
export function useCommand() {
	const commandEvent = useContext(CommandEventContext);

	return <K extends keyof CommandPayloads>(
		commandName: K,
		...args: CommandPayloads[K] extends void
			? [payload?: void]
			: [payload: CommandPayloads[K]]
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
}
