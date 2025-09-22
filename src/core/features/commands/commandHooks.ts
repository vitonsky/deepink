import { useContext, useEffect } from 'react';

import { CommandEventContext, CommandPayloads } from './CommandEventProvider';

/**
 * Returns a function that calls a command by its name
 */
export function useCommand() {
	const commandEvent = useContext(CommandEventContext);
	if (!commandEvent) throw new Error(`CommandEventContext is not provided`);

	return <K extends keyof CommandPayloads>(
		commandName: K,
		payload?: CommandPayloads[K] extends void ? undefined : CommandPayloads[K],
	) => {
		commandEvent({ name: commandName, payload });
	};
}

/**
 * Calls the provided callback whenever the given command is triggered
 */
export function useCommandCallback<K extends keyof CommandPayloads>(
	commandName: K,
	callback: (payload: CommandPayloads[K]) => void,
) {
	const commandEvent = useContext(CommandEventContext);
	if (!commandEvent) throw new Error('CommandEventContext is not provided');

	useEffect(() => {
		return commandEvent.watch((command) => {
			if (command.name !== commandName) return;
			callback(command.payload);
		});
	}, [callback, commandEvent, commandName]);
}
