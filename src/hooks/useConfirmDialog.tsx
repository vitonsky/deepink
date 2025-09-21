import React, { ReactNode, useCallback } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import {
	Box,
	HStack,
	ModalBody,
	ModalCloseButton,
	ModalHeader,
	VStack,
} from '@chakra-ui/react';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';

export const useConfirmDialog = () => {
	const { show } = useWorkspaceModal();

	return useCallback(
		(
			getContent: (props: { onClose: () => void }) => {
				title: ReactNode;
				content: ReactNode;
				action?: ReactNode;
			},
		) => {
			show({
				content: ({ onClose }) => {
					const { title, content, action } = getContent({ onClose });
					return (
						<>
							<ModalCloseButton />
							<ModalHeader>
								<Box>{title}</Box>
							</ModalHeader>
							<ModalBody paddingBottom="1rem">
								<VStack w="100%" gap="1rem" align="start">
									<Box>{content}</Box>

									{action && (
										<HStack
											justifyContent="end"
											as={AutoFocusInside}
											w="100%"
										>
											{action}
										</HStack>
									)}
								</VStack>
							</ModalBody>
						</>
					);
				},
			});
		},
		[show],
	);
};
