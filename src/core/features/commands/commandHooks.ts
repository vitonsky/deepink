import { useContext, useEffect, useRef } from 'react';

import {
	CommandEvent,
	CommandEventContext,
	CommandPayloads,
} from './CommandEventProvider';

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

function hasCommandPayload<K extends keyof CommandPayloads>(
	command: CommandEvent<K>,
): command is { name: K; payload: CommandPayloads[K] } {
	return 'payload' in command;
}

/**
 * Calls the provided callback whenever the given command is triggered.
 *
 *  Return function for unsubscribe.
 */
export function useCommandCallback<K extends keyof CommandPayloads>(
	commandName: K,
	callback: (payload?: CommandPayloads[K]) => void,
) {
	const commandEvent = useContext(CommandEventContext);
	const unsubscribe = useRef(() => {});

	useEffect(() => {
		unsubscribe.current = commandEvent.watch((command) => {
			if (command.name !== commandName) return;

			hasCommandPayload(command) ? callback(command.payload) : callback();
		});
		return unsubscribe.current;
	}, [callback, commandEvent, commandName]);

	return () => unsubscribe.current();
}
