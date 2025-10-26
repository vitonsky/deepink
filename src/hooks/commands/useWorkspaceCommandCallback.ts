import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';

import { useCommandCallback } from './useCommandCallback';
import { CommandPayloadsMap } from '.';

/**
 * Subscribes to a command event only within the current workspace context
 * and automatically unsubscribes when the workspace is not active or the component unmounts.
 */
export const useWorkspaceCommandCallback = <K extends keyof CommandPayloadsMap>(
	commandName: K,
	callback: (payload: CommandPayloadsMap[K]) => void,
	{ enabled = true }: { enabled?: boolean } = {},
) => {
	const isActiveWorkspace = useIsActiveWorkspace();

	useCommandCallback(commandName, callback, {
		enabled: isActiveWorkspace && enabled,
	});
};
