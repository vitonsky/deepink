import React from 'react';
import { useAppSelector } from '@state/redux/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

import { WorkspaceError } from './WorkspaceError';

export const ActiveWorkspaceError = ({
	profileId,
	error,
	onReset,
}: {
	profileId: string;
	error: { error: Error | null; workspaceId: string } | null;
	onReset: () => void;
}) => {
	const activeWorkspace = useAppSelector(selectActiveWorkspaceInfo({ profileId }));

	if (!error || error.workspaceId !== activeWorkspace?.id) return null;

	return <WorkspaceError resetError={onReset} />;
};
