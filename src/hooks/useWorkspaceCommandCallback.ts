import { useContext, useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { CommandPayloads } from '@core/features/commands/CommandEventProvider';
import { useCommandCallback } from '@core/features/commands/commandHooks';
import { WorkspaceContext } from '@features/App/Workspace';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

/**
 * Subscribes to a command event and automatically unsubscribes
 * if the current workspace context does not match the active workspace
 */
export function useWorkspaceCommandCallback<K extends keyof CommandPayloads>(
	commandName: K,
	callback: (payload: CommandPayloads[K]) => void,
) {
	const currentWorkspace = useContext(WorkspaceContext);
	const { profileId } = useWorkspaceData();
	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);

	const unsubscribe = useCommandCallback(commandName, callback);

	useEffect(() => {
		if (!currentWorkspace) throw new Error('WorkspaceContext required but missing');
		if (activeWorkspace?.id !== currentWorkspace.workspaceId) {
			unsubscribe();
		}
	}, [activeWorkspace?.id, currentWorkspace, unsubscribe]);
}
