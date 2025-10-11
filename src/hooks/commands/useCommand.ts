import { useContext } from 'react';

import { CommandEventContext } from './CommandEventProvider';
import { CommandPayloads } from '.';

export const useCommand = () => {
	const commandEvent = useContext(CommandEventContext);

	return <K extends keyof CommandPayloads>(
		commandName: K,
		...args: CommandPayloads[K] extends void
			? [payload?: undefined]
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
};
