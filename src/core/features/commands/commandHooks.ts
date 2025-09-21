import { useContext, useEffect } from 'react';

import { CommandEventContext, CommandPayloads } from './CommandEventProvider';

/**
 * Returns a function that calls a command by its name
 */
export function useCommand() {
	const commandEvent = useContext(CommandEventContext);
	if (!commandEvent) throw new Error(`Did not provide value for CommandEventContext`);

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
	if (!commandEvent) throw new Error('Did not provide value for CommandEventContext');

	useEffect(() => {
		return commandEvent.watch((data) => {
			if (data.name !== commandName) return;
			callback(data.payload);
		});
	}, [callback, commandEvent, commandName]);
}
