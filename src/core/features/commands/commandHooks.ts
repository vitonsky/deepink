import { useContext, useEffect, useRef } from 'react';

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

/**
 * Calls the provided callback whenever the given command is triggered.
 *
 *  Return function for unsubscribe.
 */
export function useCommandCallback<K extends keyof CommandPayloads>(
	commandName: K,
	callback: (payload: CommandPayloads[K]) => void,
) {
	const commandEvent = useContext(CommandEventContext);
	const unsubscribe = useRef(() => {});

	useEffect(() => {
		unsubscribe.current = commandEvent.watch((command) => {
			if (command.name !== commandName) return;

			// Currently payload is void for all commands, but future commands may include payload
			// We extract the payload if it exists and cast the type so the callback works both for commands with and without payload
			const payload = (
				'payload' in command ? command.payload : undefined
			) as CommandPayloads[K];

			callback(payload);
		});
		return unsubscribe.current;
	}, [callback, commandEvent, commandName]);

	return () => unsubscribe.current();
}
