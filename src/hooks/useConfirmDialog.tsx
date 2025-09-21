import React, { ReactNode, useCallback } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import {
	HStack,
	ModalBody,
	ModalCloseButton,
	ModalHeader,
	Text,
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
								<Text>{title}</Text>
							</ModalHeader>
							<ModalBody paddingBottom="1rem">
								<VStack w="100%" gap="1rem" align="start">
									<Text>{content}</Text>

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
