import React from 'react';
import { Modal, ModalProps } from '@chakra-ui/react';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';

/**
 * Modal window bound to a workspace context
 *
 * Window automatically will be hidden if workspace will be inactive,
 * and become visible back when workspace will be active again.
 */
export const WorkspaceModal = (props: ModalProps) => {
	const isActiveWorkspace = useIsActiveWorkspace();

	return (
		<Modal {...props} isOpen={Boolean(isActiveWorkspace && props.isOpen)}>
			{props.children}
		</Modal>
	);
};
