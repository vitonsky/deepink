import { useEffect, useMemo } from 'react';
import { isEqual } from 'lodash';
import { CommandPayloads } from '@hooks/commands/CommandEventProvider';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
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
	const { profileId, workspaceId: contextWorkspaceId } = useWorkspaceData();
	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);

	// Updating `activeWorkspace` causes the parent components to re-render
	// which triggers a callback update, leading to a new subscription
	const unsubscribe = useCommandCallback(commandName, callback);

	useEffect(() => {
		if (activeWorkspace?.id !== contextWorkspaceId) {
			unsubscribe();
		}
	}, [activeWorkspace?.id, contextWorkspaceId, unsubscribe]);
}
