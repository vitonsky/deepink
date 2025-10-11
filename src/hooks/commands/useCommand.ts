import { useCommandBusContext } from './CommandEventProvider';
import { CommandPayloads } from '.';

export const useCommand = () => {
	const commandBus = useCommandBusContext();

	return <K extends keyof CommandPayloads>(
		commandName: K,
		...args: CommandPayloads[K] extends void
			? [payload?: void | undefined]
			: [payload: CommandPayloads[K]]
	) => {
		commandBus.emit(commandName, ...args);
	};
};
