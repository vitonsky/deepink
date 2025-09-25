import { useContext, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { WorkspaceContext } from '@features/App/Workspace';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

import { CommandEventContext, CommandPayloads } from './CommandEventProvider';

/**
 * Returns a function that calls a command by its name
 */
export function useCommand() {
	const commandEvent = useContext(CommandEventContext);
	const { profileId } = useWorkspaceData();
	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);

	return <K extends keyof CommandPayloads>(
		commandName: K,
		...args: CommandPayloads[K] extends void
			? [payload?: void]
			: [payload: CommandPayloads[K]]
	) => {
		if (!activeWorkspace) return;

		const [payload] = args;
		const data =
			payload === undefined
				? { name: commandName, workspaceId: activeWorkspace.id }
				: {
						name: commandName,
						workspaceId: activeWorkspace.id,
						payload,
				  };

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
	const currentWorkspace = useContext(WorkspaceContext);

	useEffect(() => {
		return commandEvent.watch((command) => {
			if (command.name !== commandName) return;
			if (command.workspaceId !== currentWorkspace?.workspaceId) return;

			// Currently payload is void for all commands, but future commands may include payload
			// We extract the payload if it exists and cast the type so the callback works both for commands with and without payload
			const payload = (
				'payload' in command ? command.payload : undefined
			) as CommandPayloads[K];

			callback(payload);
		});
	}, [callback, commandEvent, commandName, currentWorkspace?.workspaceId]);
}
