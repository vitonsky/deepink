import React, { FC } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import {
	Box,
	Button,
	HStack,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
} from '@chakra-ui/react';

export type ModalDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description: string;
	confirmButtonText: string;
	cancelButtonText: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export const ModalDialog: FC<ModalDialogProps> = ({
	isOpen,
	onClose,
	title,
	description,
	confirmButtonText,
	cancelButtonText,
	onConfirm,
	onCancel,
}) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} isCentered>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>
					<Text>{title}</Text>
				</ModalHeader>
				<ModalBody>
					<Text color="typography.secondary">{description}</Text>
				</ModalBody>
				<ModalFooter>
					<Box as={AutoFocusInside} w="100%">
						<HStack w="100%" justifyContent="end">
							<Button
								onClick={() => {
									onCancel();
									onClose();
								}}
							>
								{cancelButtonText}
							</Button>
							<Button
								variant="primary"
								onClick={() => {
									onConfirm();
									onClose();
								}}
							>
								{confirmButtonText}
							</Button>
						</HStack>
					</Box>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};
