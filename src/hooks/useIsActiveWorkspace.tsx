import { useMemo } from 'react';
import { isEqual } from 'lodash';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

export const useIsActiveWorkspace = () => {
	const workspaceData = useWorkspaceData();
	const { profileId } = useWorkspaceData();

	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);
	return Boolean(activeWorkspace && activeWorkspace.id === workspaceData.workspaceId);
};
