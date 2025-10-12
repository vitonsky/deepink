import { useMemo } from 'react';
import { isEqual } from 'lodash';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

import { useCommandCallback } from './useCommandCallback';
import { CommandPayloadsMap } from '.';

/**
 * Subscribes to a command event only within the current workspace context
 * and automatically unsubscribes when the workspace is not active or the component unmounts.
 */
export const useWorkspaceCommandCallback = <K extends keyof CommandPayloadsMap>(
	commandName: K,
	callback: (payload: CommandPayloadsMap[K]) => void,
	options?: { enabled?: boolean },
) => {
	const { profileId, workspaceId: contextWorkspaceId } = useWorkspaceData();
	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);

	const isEnabled = activeWorkspace?.id === contextWorkspaceId;

	useCommandCallback(commandName, callback, {
		enabled: isEnabled && options?.enabled !== false,
	});
};
