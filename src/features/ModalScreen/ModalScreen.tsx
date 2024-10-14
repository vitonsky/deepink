import React, { FC, HTMLAttributes } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { Box, Button, HStack, Modal, ModalContent, Text, VStack } from '@chakra-ui/react';

export interface ModalScreenProps extends HTMLAttributes<HTMLDivElement> {
	isVisible?: boolean;
	onClose?: () => void;
	title?: string;
}

export const ModalScreen: FC<ModalScreenProps> = ({
	isVisible,
	onClose,
	title,
	children,
	...rest
}) => {
	return (
		<Modal
			size="full"
			isOpen={Boolean(isVisible)}
			onClose={() => {
				if (onClose) {
					onClose();
				}
			}}
			{...rest}
		>
			<ModalContent w="100%" h="100%">
				<VStack w="100%" h="100%" maxW="800px" margin="auto">
					{Boolean(title || onClose) && (
						<HStack w="100%" padding=".3rem">
							{title && (
								<Text fontSize="1rem" fontWeight="bold">
									{title}
								</Text>
							)}
							{onClose && (
								<Button
									variant="ghost"
									onClick={onClose}
									marginLeft="auto"
									borderRadius="100%"
									padding="0"
									width="auto"
								>
									<FaXmark />
								</Button>
							)}
						</HStack>
					)}

					<Box display="flex" flex="1" w="100%" h="100%">
						{children}
					</Box>
				</VStack>
			</ModalContent>
		</Modal>
	);
};
