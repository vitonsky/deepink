import { useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

import { useCommandBusContext } from './CommandEventProvider';
import { CommandPayloads } from '.';

/**
 * Subscribes to a command event only within the current workspace context
 * and automatically unsubscribes when the workspace is not active or the component unmounts.
 */
export function useWorkspaceCommandCallback<K extends keyof CommandPayloads>(
	commandName: K,
	callback: (payload: CommandPayloads[K]) => void,
) {
	const commandBus = useCommandBusContext();

	const { profileId, workspaceId: contextWorkspaceId } = useWorkspaceData();
	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);

	useEffect(() => {
		// subscription is active only when the current workspace matches the context workspace
		if (activeWorkspace?.id !== contextWorkspaceId) return;

		return commandBus.listen(commandName, callback);
	}, [commandBus, commandName, callback, activeWorkspace?.id, contextWorkspaceId]);
}
