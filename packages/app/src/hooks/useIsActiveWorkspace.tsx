import { useMemo } from 'react';
import { isEqual } from 'lodash';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/vaults/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/vaults/vaults';

export const useIsActiveWorkspace = () => {
	const workspaceData = useWorkspaceData();
	const { vaultId } = workspaceData;

	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ vaultId }), [vaultId]),
		isEqual,
	);
	return Boolean(activeWorkspace && activeWorkspace.id === workspaceData.workspaceId);
};
