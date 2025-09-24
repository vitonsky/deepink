import { useContext, useEffect } from 'react';

import { CommandEventContext, CommandPayloads } from './CommandEventProvider';
import { GLOBAL_COMMANDS } from '.';

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
		const data =
			args.length === 0
				? { name: commandName }
				: { name: commandName, payload: args[0] };
		commandEvent(data);
	};
}

/**
 * Calls the provided callback whenever the given command is triggered
 */
export function useCommandCallback<K extends keyof CommandPayloads>(
	commandName: GLOBAL_COMMANDS,
	callback: (payload?: CommandPayloads[K]) => void,
) {
	const commandEvent = useContext(CommandEventContext);

	useEffect(() => {
		return commandEvent.watch((command) => {
			if (command.name !== commandName) return;
			callback();
		});
	}, [callback, commandEvent, commandName]);
}
