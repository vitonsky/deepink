import React, { useMemo } from 'react';
import { isEqual } from 'lodash';
import { Modal, ModalProps } from '@chakra-ui/react';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectActiveWorkspaceInfo } from '@state/redux/profiles/profiles';

/**
 * Modal window bound to a workspace context
 *
 * Window automatically will be hidden if workspace will be inactive,
 * and become visible back when workspace will be active again.
 */
export const WorkspaceModal = (props: ModalProps) => {
	const workspaceData = useWorkspaceData();
	const { profileId } = useWorkspaceData();

	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);
	const isVisibleWorkspace =
		activeWorkspace && activeWorkspace.id === workspaceData.workspaceId;

	return (
		<Modal {...props} isOpen={Boolean(isVisibleWorkspace && props.isOpen)}>
			{props.children}
		</Modal>
	);
};
