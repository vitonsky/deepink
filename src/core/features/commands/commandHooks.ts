import { useContext, useEffect } from 'react';

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
	commandName: K,
	callback: (payload: CommandPayloads[K]) => void,
) {
	const commandEvent = useContext(CommandEventContext);

	useEffect(() => {
		return commandEvent.watch((command) => {
			if (command.name !== commandName) return;

			// Currently payload is void for all commands, but future commands may include payload
			// We extract the payload if it exists and cast the type so the callback works both for commands with and without payload
			const payload = (
				'payload' in command ? command.payload : undefined
			) as CommandPayloads[K];

			callback(payload);
		});
	}, [callback, commandEvent, commandName]);
}
