import { useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useCommandBusContext } from '@hooks/commands/CommandEventProvider';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

import { CommandPayloads } from '.';

/**
 * Subscribes to a command event and automatically unsubscribes
 * if the current workspace context does not match the active workspace
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
		let unsubscribe = () => {};
		if (activeWorkspace?.id === contextWorkspaceId) {
			unsubscribe = commandBus.handle(commandName, callback);
		}
		return unsubscribe;
	}, [activeWorkspace?.id, contextWorkspaceId, commandBus, commandName, callback]);
}
